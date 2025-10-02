import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Calendar, FileText, Plus, Eye, Edit, Trash2, Bell, CheckCircle } from 'lucide-react';
import { authService, type UserAccount } from '../lib/auth';
import { useScheduledCalls } from '../hooks/useScheduledCalls';
import { useSubscriptionForms } from '../hooks/useSubscriptionForms';
import { useAgentComments } from '../hooks/useAgentComments';
import { useAuth } from '../hooks/useAuth';

const AgentManagementPanel: React.FC = () => {
  const { user } = useAuth();
  const { scheduledCalls } = useScheduledCalls();
  const { subscriptionForms } = useSubscriptionForms();
  const { agentComments, addAgentComment, markCommentAsRead } = useAgentComments();
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<UserAccount | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserAccounts();
  }, []);

  const fetchUserAccounts = async () => {
    try {
      const accounts = await authService.getUserAccounts();
      setUserAccounts(accounts.filter(account => account.username !== 'admin'));
    } catch (error) {
      console.error('Error fetching user accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAgentStats = (agentId: string) => {
    const agentCalls = scheduledCalls.filter(call => call.agent_id === agentId);
    const agentForms = subscriptionForms.filter(form => form.agent_id === agentId);
    const agentCommentsList = agentComments.filter(comment => comment.agent_id === agentId);
    
    return {
      totalCalls: agentCalls.length,
      completedCalls: agentCalls.filter(call => call.status === 'completed').length,
      scheduledCalls: agentCalls.filter(call => call.status === 'scheduled').length,
      subscriptionForms: agentForms.length,
      unreadComments: agentCommentsList.filter(comment => !comment.is_read).length
    };
  };

  const handleAddComment = async () => {
    if (!selectedAgent || !newComment.trim() || !user) return;

    try {
      await addAgentComment({
        agent_id: selectedAgent.id,
        admin_id: user.id,
        comment: newComment.trim()
      });
      
      setNewComment('');
      setShowCommentModal(false);
      alert('Commentaire ajouté avec succès!');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Erreur lors de l\'ajout du commentaire');
    }
  };

  const handleMarkCommentAsRead = async (commentId: string) => {
    try {
      await markCommentAsRead(commentId);
    } catch (error) {
      console.error('Error marking comment as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Gestion des Agents
        </h2>

        {/* Agents Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {userAccounts.map((agent) => {
            const stats = getAgentStats(agent.id);
            const agentCommentsList = agentComments.filter(comment => comment.agent_id === agent.id);
            
            return (
              <div key={agent.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">{agent.full_name}</h3>
                    <p className="text-sm text-gray-600">@{agent.username}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {stats.unreadComments > 0 && (
                      <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        {stats.unreadComments}
                      </div>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      agent.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {agent.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>

                {/* Agent Statistics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-blue-700">Appels Total</p>
                        <p className="text-lg font-bold text-blue-900">{stats.totalCalls}</p>
                      </div>
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-green-700">Terminés</p>
                        <p className="text-lg font-bold text-green-900">{stats.completedCalls}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-yellow-700">Programmés</p>
                        <p className="text-lg font-bold text-yellow-900">{stats.scheduledCalls}</p>
                      </div>
                      <Calendar className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-purple-700">Souscriptions</p>
                        <p className="text-lg font-bold text-purple-900">{stats.subscriptionForms}</p>
                      </div>
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </div>

                {/* Recent Comments */}
                {agentCommentsList.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Commentaires récents</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {agentCommentsList.slice(0, 3).map((comment) => (
                        <div
                          key={comment.id}
                          className={`p-2 rounded text-xs ${
                            comment.is_read ? 'bg-gray-50' : 'bg-blue-50 border border-blue-200'
                          }`}
                        >
                          <p className="text-gray-700">{comment.comment}</p>
                          <p className="text-gray-500 mt-1">
                            {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                          </p>
                          {!comment.is_read && (
                            <button
                              onClick={() => handleMarkCommentAsRead(comment.id)}
                              className="text-blue-600 hover:text-blue-700 text-xs mt-1"
                            >
                              Marquer comme lu
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedAgent(agent);
                      setShowCommentModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Commenter
                  </button>
                  <button
                    onClick={() => setSelectedAgent(agent)}
                    className="flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    Détails
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {userAccounts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium">Aucun agent trouvé</p>
            <p className="text-sm">Les agents apparaîtront ici une fois créés</p>
          </div>
        )}
      </div>

      {/* Agent Details Modal */}
      {selectedAgent && !showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  Détails de l'agent - {selectedAgent.full_name}
                </h2>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Agent Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Informations</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Nom:</span> {selectedAgent.full_name}</div>
                    <div><span className="font-medium">Username:</span> {selectedAgent.username}</div>
                    <div><span className="font-medium">Email:</span> {selectedAgent.email || 'Non renseigné'}</div>
                    <div><span className="font-medium">Statut:</span> {selectedAgent.is_active ? 'Actif' : 'Inactif'}</div>
                    <div><span className="font-medium">Créé le:</span> {new Date(selectedAgent.created_at).toLocaleDateString('fr-FR')}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Statistiques</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(getAgentStats(selectedAgent.id)).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </p>
                        <p className="text-lg font-bold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Activité récente</h3>
                <div className="space-y-3">
                  {scheduledCalls
                    .filter(call => call.agent_id === selectedAgent.id)
                    .slice(0, 5)
                    .map((call) => (
                      <div key={call.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">
                            Appel avec {call.clients?.prenom} {call.clients?.nom}
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(call.scheduled_date).toLocaleDateString('fr-FR')} - {call.status}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          call.status === 'completed' ? 'bg-green-100 text-green-800' :
                          call.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {call.status}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  Commentaire pour {selectedAgent.full_name}
                </h2>
                <button
                  onClick={() => {
                    setShowCommentModal(false);
                    setNewComment('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votre commentaire
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                  placeholder="Ajoutez un commentaire pour cet agent..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCommentModal(false);
                    setNewComment('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentManagementPanel;