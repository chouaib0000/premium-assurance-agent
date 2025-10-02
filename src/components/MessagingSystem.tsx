import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, ArrowLeft, Search, Plus, X } from 'lucide-react';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerRole: string;
  lastMessage: any;
  unreadCount: number;
}

export default function MessagingSystem() {
  const { user, isAdmin } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, markAsRead, getConversations } = useMessages(selectedConversation || undefined);

  useEffect(() => {
    loadConversations();
    loadAvailableUsers();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedConversation) {
      const unreadMessages = messages
        .filter(m => m.recipient_id === user?.id && !m.read)
        .map(m => m.id);

      if (unreadMessages.length > 0) {
        markAsRead(unreadMessages);
      }
    }
  }, [messages, selectedConversation, user?.id]);

  const loadConversations = async () => {
    const convs = await getConversations();
    setConversations(convs);
  };

  const loadAvailableUsers = async () => {
    try {
      console.log('🔍 Loading available users, current user:', user?.id, 'isAdmin:', isAdmin);

      let query = supabase
        .from('user_accounts')
        .select('id, full_name, username, created_by')
        .eq('is_active', true);

      if (user?.id && user.id !== 'admin') {
        query = query.neq('id', user.id);
      }

      const { data, error } = await query;

      console.log('📊 Available users query result:', { data, error, userCount: data?.length });

      if (error) {
        console.error('❌ Query error:', error);
        throw error;
      }

      setAvailableUsers(data || []);
    } catch (error) {
      console.error('❌ Error loading users:', error);
    }
  };

  const startNewConversation = (userId: string) => {
    setSelectedConversation(userId);
    setShowNewMessageModal(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    await sendMessage(selectedConversation, messageText);
    setMessageText('');
    await loadConversations();
  };

  const selectConversation = (partnerId: string) => {
    setSelectedConversation(partnerId);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.partnerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPartner = conversations.find(c => c.partnerId === selectedConversation) ||
    (selectedConversation ? availableUsers.find(u => u.id === selectedConversation) : null);

  const getPartnerName = () => {
    if (!selectedPartner) return 'Unknown';
    return 'partnerName' in selectedPartner ? selectedPartner.partnerName : selectedPartner.full_name;
  };

  const getPartnerRole = () => {
    if (!selectedPartner) return '';
    return 'partnerRole' in selectedPartner ? selectedPartner.partnerRole : selectedPartner.username;
  };

  return (
    <div className="h-full flex bg-gray-50">
      {/* Conversations List */}
      <div className={`w-full md:w-80 bg-white border-r border-gray-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
            <button
              onClick={() => setShowNewMessageModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              title="Nouveau message"
            >
              <Plus className="w-4 h-4" />
              Nouveau
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No conversations yet
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.partnerId}
                onClick={() => selectConversation(conv.partnerId)}
                className={`w-full p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left ${
                  selectedConversation === conv.partnerId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                      {conv.partnerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{conv.partnerName}</div>
                      <div className="text-xs text-gray-500 capitalize">{conv.partnerRole}</div>
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {conv.lastMessage.sender_id === user?.id ? 'You: ' : ''}
                  {conv.lastMessage.content}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(conv.lastMessage.created_at).toLocaleString()}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                {getPartnerName().charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{getPartnerName()}</div>
                <div className="text-xs text-gray-500">{getPartnerRole()}</div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isOwn = message.sender_id === user?.id;
                return (
                  <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs md:max-w-md lg:max-w-lg ${isOwn ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-lg p-3 ${
                          isOwn
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg mb-4">Select a conversation to start messaging</p>
              <button
                onClick={() => setShowNewMessageModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Commencer un nouveau message
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Nouveau message</h2>
              <button
                onClick={() => setShowNewMessageModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                Sélectionnez un utilisateur pour commencer une conversation:
              </p>
              <div className="space-y-2">
                {availableUsers
                  .filter(u => {
                    if (isAdmin) return true;
                    return u.created_by === 'admin' || u.username.toLowerCase().includes('admin');
                  })
                  .map((availableUser) => (
                    <button
                      key={availableUser.id}
                      onClick={() => startNewConversation(availableUser.id)}
                      className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                        {availableUser.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{availableUser.full_name}</div>
                        <div className="text-sm text-gray-500">
                          @{availableUser.username}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
              {availableUsers.filter(u => isAdmin || u.created_by === 'admin' || u.username.toLowerCase().includes('admin')).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucun utilisateur disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}