import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/auth';
import type { Database } from '../lib/supabase';

type CallHistory = {
  id: string;
  client_id: string;
  agent_id: string;
  call_date: string;
  duration_minutes: number;
  call_type: 'initial' | 'follow_up' | 'closing' | 'information';
  outcome: 'interested' | 'not_interested' | 'callback_requested' | 'subscription_confirmed' | 'no_answer' | 'busy' | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type CallHistoryInsert = {
  client_id: string;
  agent_id: string;
  call_date: string;
  duration_minutes: number;
  call_type: 'initial' | 'follow_up' | 'closing' | 'information';
  outcome?: 'interested' | 'not_interested' | 'callback_requested' | 'subscription_confirmed' | 'no_answer' | 'busy' | null;
  notes?: string | null;
};

export const useCallHistory = () => {
  const [callHistory, setCallHistory] = useState<CallHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableExists, setTableExists] = useState(true);

  const fetchCallHistory = async (clientId?: string) => {
    try {
      setLoading(true);
      
      // Check if call_history table exists first
      const { error: tableCheckError } = await supabase
        .from('call_history')
        .select('id')
        .limit(1);
      
      if (tableCheckError && tableCheckError.code === '42P01') {
        // Table doesn't exist
        setTableExists(false);
        setCallHistory([]);
        setLoading(false);
        return;
      }
      
      const currentAuth = authService.getCurrentUser();
      let query = supabase
        .from('call_history')
        .select(`
          *,
          clients (
            id,
            nom,
            prenom,
            telephone
          ),
          user_accounts (
            id,
            username,
            full_name
          )
        `);
      
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      
      // If not admin, filter by agent
      if (!currentAuth.isAdmin && currentAuth.user) {
        query = query.eq('agent_id', currentAuth.user.id);
      }
      
      const { data, error } = await query.order('call_date', { ascending: false });

      if (error) throw error;
      setCallHistory(data || []);
      setTableExists(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      if (errorMessage.includes('does not exist')) {
        setTableExists(false);
        setCallHistory([]);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const addCallHistory = async (callData: CallHistoryInsert) => {
    if (!tableExists) {
      throw new Error('Call history feature is not available. Please contact your administrator.');
    }
    
    try {
      const { data, error } = await supabase
        .from('call_history')
        .insert([callData])
        .select(`
          *,
          clients (
            id,
            nom,
            prenom,
            telephone
          ),
          user_accounts (
            id,
            username,
            full_name
          )
        `)
        .single();

      if (error) throw error;
      
      setCallHistory(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add call history');
      throw err;
    }
  };

  const deleteCallHistory = async (callId: string) => {
    if (!tableExists) {
      throw new Error('Call history feature is not available. Please contact your administrator.');
    }
    
    try {
      const { error } = await supabase
        .from('call_history')
        .delete()
        .eq('id', callId);

      if (error) throw error;
      
      setCallHistory(prev => prev.filter(call => call.id !== callId));
    } catch (err) {
      console.error('Delete call history error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete call history');
      throw err;
    }
  };

  const clearOldCallHistory = async (daysOld: number = 30) => {
    if (!tableExists) {
      throw new Error('La fonctionnalité d\'historique des appels n\'est pas disponible.');
    }
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const { error } = await supabase
        .from('call_history')
        .delete()
        .lt('call_date', cutoffDate.toISOString());

      if (error) throw error;
      
      // Refresh the call history after clearing
      await fetchCallHistory();
      
      return true;
    } catch (err) {
      console.error('Clear old call history error:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear old call history');
      throw err;
    }
  };

  useEffect(() => {
    fetchCallHistory();
  }, []);

  return {
    callHistory,
    loading,
    error,
    tableExists,
    addCallHistory,
    deleteCallHistory,
    clearOldCallHistory,
    fetchCallHistory,
    refetch: fetchCallHistory
  };
};