import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/auth';

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface MessageWithUser extends Message {
  sender_name?: string;
  recipient_name?: string;
}

export function useMessages(recipientId?: string) {
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const authState = authService.getCurrentUser();
      const userId = authState.user?.id;

      if (!userId) return;

      let query = supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: true });

      if (recipientId) {
        query = query.or(`and(sender_id.eq.${userId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${userId})`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user names
      const userIds = [...new Set(data?.flatMap(m => [m.sender_id, m.recipient_id]) || [])];
      const { data: users } = await supabase
        .from('user_accounts')
        .select('id, full_name')
        .in('id', userIds);

      const userMap = new Map(users?.map(u => [u.id, u.full_name]) || []);

      const messagesWithUsers = data?.map(m => ({
        ...m,
        sender_name: userMap.get(m.sender_id),
        recipient_name: userMap.get(m.recipient_id),
      })) || [];

      setMessages(messagesWithUsers);

      // Count unread messages
      const unread = data?.filter(m => m.recipient_id === userId && !m.read).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('messages-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [recipientId]);

  const sendMessage = async (recipientId: string, content: string) => {
    try {
      const authState = authService.getCurrentUser();
      const senderId = authState.user?.id;

      if (!senderId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: senderId,
          recipient_id: recipientId,
          content,
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error sending message:', error);
      return { data: null, error };
    }
  };

  const markAsRead = async (messageIds: string[]) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .in('id', messageIds);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { error };
    }
  };

  const getConversations = async () => {
    try {
      const authState = authService.getCurrentUser();
      const userId = authState.user?.id;

      if (!userId) return [];

      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (!messages) return [];

      // Get unique conversation partners
      const partners = new Map<string, { lastMessage: Message; unreadCount: number }>();

      messages.forEach(msg => {
        const partnerId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;

        if (!partners.has(partnerId)) {
          const unread = messages.filter(
            m => m.sender_id === partnerId && m.recipient_id === userId && !m.read
          ).length;

          partners.set(partnerId, { lastMessage: msg, unreadCount: unread });
        }
      });

      // Fetch partner details
      const partnerIds = Array.from(partners.keys());
      const { data: users } = await supabase
        .from('user_accounts')
        .select('id, full_name, username, created_by')
        .in('id', partnerIds);

      return Array.from(partners.entries()).map(([partnerId, data]) => {
        const user = users?.find(u => u.id === partnerId);
        return {
          partnerId,
          partnerName: user?.full_name || 'Unknown',
          partnerRole: user?.username || 'user',
          lastMessage: data.lastMessage,
          unreadCount: data.unreadCount,
        };
      });
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  };

  return {
    messages,
    loading,
    unreadCount,
    sendMessage,
    markAsRead,
    getConversations,
    refetch: fetchMessages,
  };
}