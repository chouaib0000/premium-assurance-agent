import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert'];

export const useActivityLogs = () => {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100); // Limit to last 100 activities

      if (error) throw error;
      setActivityLogs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addActivityLog = async (logData: ActivityLogInsert) => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert([logData])
        .select()
        .single();

      if (error) throw error;
      
      // Add to local state immediately for better UX
      setActivityLogs(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add activity log');
      throw err;
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  return {
    activityLogs,
    loading,
    error,
    addActivityLog,
    refetch: fetchActivityLogs
  };
};