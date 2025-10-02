import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/auth';
import type { Database } from '../lib/supabase';

type AgentComment = Database['public']['Tables']['agent_comments']['Row'];
type AgentCommentInsert = Database['public']['Tables']['agent_comments']['Insert'];

export const useAgentComments = () => {
  const [agentComments, setAgentComments] = useState<AgentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentComments = async () => {
    try {
      setLoading(true);
      
      const currentAuth = authService.getCurrentUser();
      let query = supabase
        .from('agent_comments')
        .select(`
          *,
          agent:user_accounts!agent_id (
            id,
            username,
            full_name
          ),
          admin:user_accounts!admin_id (
            id,
            username,
            full_name
          )
        `);
      
      // If not admin, filter by agent
      if (!currentAuth.isAdmin && currentAuth.user) {
        query = query.eq('agent_id', currentAuth.user.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setAgentComments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addAgentComment = async (commentData: AgentCommentInsert) => {
    try {
      const { data, error } = await supabase
        .from('agent_comments')
        .insert([commentData])
        .select(`
          *,
          agent:user_accounts!agent_id (
            id,
            username,
            full_name
          ),
          admin:user_accounts!admin_id (
            id,
            username,
            full_name
          )
        `)
        .single();

      if (error) throw error;
      
      setAgentComments(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add agent comment');
      throw err;
    }
  };

  const markCommentAsRead = async (commentId: string) => {
    try {
      const { data, error } = await supabase
        .from('agent_comments')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .select(`
          *,
          agent:user_accounts!agent_id (
            id,
            username,
            full_name
          ),
          admin:user_accounts!admin_id (
            id,
            username,
            full_name
          )
        `)
        .single();

      if (error) throw error;
      
      setAgentComments(prev => prev.map(comment => 
        comment.id === commentId ? { ...comment, ...data } : comment
      ));
      
      return data;
    } catch (err) {
      console.error('Mark comment as read error:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark comment as read');
      throw err;
    }
  };

  const deleteAgentComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('agent_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      
      setAgentComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (err) {
      console.error('Delete agent comment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete agent comment');
      throw err;
    }
  };

  const getUnreadComments = () => {
    return agentComments.filter(comment => !comment.is_read);
  };

  useEffect(() => {
    fetchAgentComments();
  }, []);

  return {
    agentComments,
    loading,
    error,
    addAgentComment,
    markCommentAsRead,
    deleteAgentComment,
    getUnreadComments,
    refetch: fetchAgentComments
  };
};