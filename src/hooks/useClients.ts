import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/auth';
import type { Database } from '../lib/supabase';

type Client = Database['public']['Tables']['clients']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      const currentAuth = authService.getCurrentUser();
      let query = supabase.from('clients').select(`
        id,
        nom,
        prenom,
        date_naissance,
        telephone,
        adresse,
        iban,
        mutuelle_actuelle,
        nouvelle_adhesion,
        resiliation,
        agent,
        is_completed,
        completed_at,
        completed_by,
        created_at,
        updated_at,
        agent_comments,
        user_account_id,
        conjoint,
        enfants
      `);
      
      // If not admin, filter by user account
      if (!currentAuth.isAdmin && currentAuth.user) {
        query = query.eq('user_account_id', currentAuth.user.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientWithFiles = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Fetch client with files error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch client details');
      throw err;
    }
  };

  const addClient = async (clientData: ClientInsert) => {
    try {
      const currentAuth = authService.getCurrentUser();
      
      // Add user_account_id if user is logged in and not admin
      if (!currentAuth.isAdmin && currentAuth.user) {
        clientData.user_account_id = currentAuth.user.id;
      }
      
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) throw error;
      
      // Add to local state immediately for better UX
      setClients(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add client');
      throw err;
    }
  };

  const updateClient = async (clientId: string, clientData: Partial<Client>) => {
    try {
      // Add updated_at timestamp
      const dataWithTimestamp = {
        ...clientData,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('clients')
        .update(dataWithTimestamp)
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setClients(prev => prev.map(client => 
        client.id === clientId ? { ...client, ...data } : client
      ));
      
      return data;
    } catch (err) {
      console.error('Update client error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update client');
      throw err;
    }
  };

  const deleteClient = async (clientId: string) => {
    try {
      console.log('Attempting to delete client:', clientId);
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) {
        console.error('Supabase deletion error:', error);
        throw error;
      }
      
      console.log('Client deleted successfully from database');
      
      // Remove from local state immediately for better UX
      setClients(prev => prev.filter(client => client.id !== clientId));
      
    } catch (err) {
      console.error('Delete client error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete client');
      // If deletion fails, refresh the clients list to ensure consistency
      fetchClients();
      throw err;
    }
  };

  const markClientAsCompleted = async (clientId: string) => {
    try {
      const currentAuth = authService.getCurrentUser();
      
      const { error } = await supabase
        .from('clients')
        .update({ 
          is_completed: true,
          completed_at: new Date().toISOString(),
          completed_by: currentAuth.user?.username || 'admin'
        })
        .eq('id', clientId);

      if (error) throw error;
      
      // Update local state
      setClients(prev => prev.map(client => 
        client.id === clientId 
          ? { 
              ...client, 
              is_completed: true, 
              completed_at: new Date().toISOString(),
              completed_by: currentAuth.user?.username || 'admin'
            }
          : client
      ));
      
    } catch (err) {
      console.error('Mark client as completed error:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark client as completed');
      throw err;
    }
  };

  const getClientsByUser = (userId: string) => {
    return clients.filter(client => client.user_account_id === userId);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
    markClientAsCompleted,
    getClientsByUser,
    fetchClientWithFiles,
    refetch: fetchClients
  };
};