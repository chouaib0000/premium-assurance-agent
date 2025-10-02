import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/auth';
import type { Database } from '../lib/supabase';

type SubscriptionForm = Database['public']['Tables']['subscription_forms']['Row'];
type SubscriptionFormInsert = Database['public']['Tables']['subscription_forms']['Insert'];

export const useSubscriptionForms = () => {
  const [subscriptionForms, setSubscriptionForms] = useState<SubscriptionForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionForms = async () => {
    try {
      setLoading(true);
      
      const currentAuth = authService.getCurrentUser();
      let query = supabase
        .from('subscription_forms')
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
          scheduled_calls (
            id,
            scheduled_date,
            call_type
          )
        `);
      
      // If not admin, filter by agent
      if (!currentAuth.isAdmin && currentAuth.user) {
        query = query.eq('agent_id', currentAuth.user.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptionForms(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addSubscriptionForm = async (formData: SubscriptionFormInsert) => {
    try {
      const { data, error } = await supabase
        .from('subscription_forms')
        .insert([formData])
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
          scheduled_calls (
            id,
            scheduled_date,
            call_type
          )
        `)
        .single();

      if (error) throw error;
      
      setSubscriptionForms(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subscription form');
      throw err;
    }
  };

  const updateSubscriptionForm = async (formId: string, formData: Partial<SubscriptionForm>) => {
    try {
      const dataWithTimestamp = {
        ...formData,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('subscription_forms')
        .update(dataWithTimestamp)
        .eq('id', formId)
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
          scheduled_calls (
            id,
            scheduled_date,
            call_type
          )
        `)
        .single();

      if (error) throw error;
      
      setSubscriptionForms(prev => prev.map(form => 
        form.id === formId ? { ...form, ...data } : form
      ));
      
      return data;
    } catch (err) {
      console.error('Update subscription form error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update subscription form');
      throw err;
    }
  };

  const deleteSubscriptionForm = async (formId: string) => {
    try {
      const { error } = await supabase
        .from('subscription_forms')
        .delete()
        .eq('id', formId);

      if (error) throw error;
      
      setSubscriptionForms(prev => prev.filter(form => form.id !== formId));
    } catch (err) {
      console.error('Delete subscription form error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete subscription form');
      throw err;
    }
  };

  useEffect(() => {
    fetchSubscriptionForms();
  }, []);

  return {
    subscriptionForms,
    loading,
    error,
    addSubscriptionForm,
    updateSubscriptionForm,
    deleteSubscriptionForm,
    refetch: fetchSubscriptionForms
  };
};