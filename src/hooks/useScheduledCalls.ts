import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/auth';
import type { Database } from '../lib/supabase';

type ScheduledCall = Database['public']['Tables']['scheduled_calls']['Row'];
type ScheduledCallInsert = Database['public']['Tables']['scheduled_calls']['Insert'];

export const useScheduledCalls = () => {
  const [scheduledCalls, setScheduledCalls] = useState<ScheduledCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScheduledCalls = async () => {
    try {
      setLoading(true);
      
      const currentAuth = authService.getCurrentUser();
      let query = supabase
        .from('scheduled_calls')
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
          ),
          audio_files
        `);
      
      // If not admin, filter by agent
      if (!currentAuth.isAdmin && currentAuth.user) {
        query = query.eq('agent_id', currentAuth.user.id);
      }
      
      const { data, error } = await query.order('scheduled_date', { ascending: true });

      if (error) throw error;
      setScheduledCalls(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addScheduledCall = async (callData: ScheduledCallInsert) => {
    try {
      const { data, error } = await supabase
        .from('scheduled_calls')
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
          ),
          audio_files
        `)
        .single();

      if (error) throw error;
      
      setScheduledCalls(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add scheduled call');
      throw err;
    }
  };

  const updateScheduledCall = async (callId: string, callData: Partial<ScheduledCall>) => {
    try {
      const dataWithTimestamp = {
        ...callData,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('scheduled_calls')
        .update(dataWithTimestamp)
        .eq('id', callId)
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
          ),
          audio_files
        `)
        .single();

      if (error) throw error;
      
      setScheduledCalls(prev => prev.map(call => 
        call.id === callId ? { ...call, ...data } : call
      ));
      
      return data;
    } catch (err) {
      console.error('Update scheduled call error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update scheduled call');
      throw err;
    }
  };

  const deleteScheduledCall = async (callId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_calls')
        .delete()
        .eq('id', callId);

      if (error) throw error;
      
      setScheduledCalls(prev => prev.filter(call => call.id !== callId));
    } catch (err) {
      console.error('Delete scheduled call error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete scheduled call');
      throw err;
    }
  };

  const getUpcomingCalls = (hours: number = 24) => {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
    
    return scheduledCalls.filter(call => {
      const callDate = new Date(call.scheduled_date);
      return callDate >= now && callDate <= futureTime && call.status === 'scheduled';
    });
  };

  const getTodaysCalls = () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return scheduledCalls.filter(call => {
      const callDate = new Date(call.scheduled_date);
      return callDate >= startOfDay && callDate < endOfDay;
    });
  };

  useEffect(() => {
    fetchScheduledCalls();
  }, []);

  return {
    scheduledCalls,
    loading,
    error,
    addScheduledCall,
    updateScheduledCall,
    deleteScheduledCall,
    getUpcomingCalls,
    getTodaysCalls,
    refetch: fetchScheduledCalls
  };
};