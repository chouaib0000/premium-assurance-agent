import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Lead {
  id: string;
  agent_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export function useLeads(agentId?: string) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      let query = supabase.from('leads').select('*').order('created_at', { ascending: false });

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();

    const channel = supabase
      .channel(`leads-changes-${agentId || 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchLeads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  const createLead = async (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('leads')
        .insert([{ ...lead, created_by: userData.user?.id }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating lead:', error);
      return { data: null, error };
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating lead:', error);
      return { data: null, error };
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting lead:', error);
      return { error };
    }
  };

  return {
    leads,
    loading,
    createLead,
    updateLead,
    deleteLead,
    refetch: fetchLeads,
  };
}