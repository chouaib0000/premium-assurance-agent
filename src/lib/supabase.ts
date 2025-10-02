import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          nom: string;
          prenom: string;
          date_naissance: string;
          adresse: string;
          telephone: string;
          conjoint: any;
          enfants: any;
          mutuelle_actuelle: any;
          nouvelle_adhesion: any;
          resiliation: 'Cabinet' | 'Compagnie';
          agent: string;
          user_account_id: string | null;
          is_completed: boolean;
          completed_at: string | null;
          completed_by: string | null;
          iban: string | null;
          files: any;
          agent_comments: string | null;
          numero_securite_sociale: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nom: string;
          prenom: string;
          date_naissance: string;
          adresse: string;
          telephone: string;
          conjoint?: any;
          enfants?: any;
          mutuelle_actuelle: any;
          nouvelle_adhesion: any;
          resiliation: 'Cabinet' | 'Compagnie';
          agent: string;
          user_account_id?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          completed_by?: string | null;
          iban?: string | null;
          files?: any;
          agent_comments?: string | null;
          numero_securite_sociale?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nom?: string;
          prenom?: string;
          date_naissance?: string;
          adresse?: string;
          telephone?: string;
          conjoint?: any;
          enfants?: any;
          mutuelle_actuelle?: any;
          nouvelle_adhesion?: any;
          resiliation?: 'Cabinet' | 'Compagnie';
          agent?: string;
          user_account_id?: string | null;
          is_completed?: boolean;
          completed_at?: string | null;
          completed_by?: string | null;
          iban?: string | null;
          files?: any;
          agent_comments?: string | null;
          numero_securite_sociale?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_accounts: {
        Row: {
          id: string;
          username: string;
          password_hash: string;
          full_name: string;
          email: string | null;
          is_active: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          password_hash: string;
          full_name: string;
          email?: string | null;
          is_active?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          password_hash?: string;
          full_name?: string;
          email?: string | null;
          is_active?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          client_id: string | null;
          action: string;
          details: string;
          timestamp: string;
          user_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          action: string;
          details: string;
          timestamp: string;
          user_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          action?: string;
          details?: string;
          timestamp?: string;
          user_name?: string;
          created_at?: string;
        };
      };
    };
    scheduled_calls: {
      Row: {
        id: string;
        client_id: string;
        agent_id: string;
        scheduled_date: string;
        duration_minutes: number;
        call_type: 'initial' | 'follow_up' | 'closing';
        status: 'scheduled' | 'completed' | 'missed' | 'cancelled';
        notes: string | null;
        outcome: 'interested' | 'not_interested' | 'callback_requested' | 'subscription_confirmed' | null;
        created_at: string;
        updated_at: string;
        completed_at: string | null;
        audio_files: any;
      };
      Insert: {
        id?: string;
        client_id: string;
        agent_id: string;
        scheduled_date: string;
        duration_minutes?: number;
        call_type: 'initial' | 'follow_up' | 'closing';
        status?: 'scheduled' | 'completed' | 'missed' | 'cancelled';
        notes?: string | null;
        outcome?: 'interested' | 'not_interested' | 'callback_requested' | 'subscription_confirmed' | null;
        created_at?: string;
        updated_at?: string;
        completed_at?: string | null;
        audio_files?: any;
      };
      Update: {
        id?: string;
        client_id?: string;
        agent_id?: string;
        scheduled_date?: string;
        duration_minutes?: number;
        call_type?: 'initial' | 'follow_up' | 'closing';
        status?: 'scheduled' | 'completed' | 'missed' | 'cancelled';
        notes?: string | null;
        outcome?: 'interested' | 'not_interested' | 'callback_requested' | 'subscription_confirmed' | null;
        created_at?: string;
        updated_at?: string;
        completed_at?: string | null;
        audio_files?: any;
      };
    };
    subscription_forms: {
      Row: {
        id: string;
        client_id: string;
        agent_id: string;
        call_id: string | null;
        form_data: any;
        status: 'draft' | 'completed' | 'submitted';
        created_at: string;
        updated_at: string;
        submitted_at: string | null;
      };
      Insert: {
        id?: string;
        client_id: string;
        agent_id: string;
        call_id?: string | null;
        form_data: any;
        status?: 'draft' | 'completed' | 'submitted';
        created_at?: string;
        updated_at?: string;
        submitted_at?: string | null;
      };
      Update: {
        id?: string;
        client_id?: string;
        agent_id?: string;
        call_id?: string | null;
        form_data?: any;
        status?: 'draft' | 'completed' | 'submitted';
        created_at?: string;
        updated_at?: string;
        submitted_at?: string | null;
      };
    };
    agent_comments: {
      Row: {
        id: string;
        agent_id: string;
        admin_id: string;
        comment: string;
        is_read: boolean;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        agent_id: string;
        admin_id: string;
        comment: string;
        is_read?: boolean;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        agent_id?: string;
        admin_id?: string;
        comment?: string;
        is_read?: boolean;
        created_at?: string;
        updated_at?: string;
      };
    };
  };
};