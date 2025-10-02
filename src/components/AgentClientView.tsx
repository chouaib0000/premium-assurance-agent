import React, { useState } from 'react';
import { Eye, MessageSquare, Save, FileText, Download, Plus, Search, Filter, ChevronLeft, ChevronRight, Phone, Calendar, History, Trash2 } from 'lucide-react';
import { useClients } from '../hooks/useClients';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { useScheduledCalls } from '../hooks/useScheduledCalls';
import { useAgentComments } from '../hooks/useAgentComments';
import { useCallHistory } from '../hooks/useCallHistory';
import { UserAccount } from '../lib/auth';
import ClientEditModal from './ClientEditModal';
import AgentForm from './AgentForm';
import CallManagement from './CallManagement';
import CallScheduler from './CallScheduler';
import CallHistoryModal from './CallHistoryModal';
import ExpandableComments from './ExpandableComments';
import type { Database } from '../lib/supabase';

type Client = Database['public']['Tables']['clients']['Row'];

interface AgentClientViewProps {
  currentUser: UserAccount;
}

const AgentClientView: React.FC<AgentClientViewProps> = ({ currentUser }) => {
  const { clients, updateClient, refetch, fetchClientWithFiles } = useClients();
  const { addActivityLog } = useActivityLogs();
  const { getUpcomingCalls } = useScheduledCalls();
  const { getUnreadComments } = useAgentComments();
  const { clearOldCallHistory } = useCallHistory();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [showCallManagement, setShowCallManagement] = useState(false);
  const [showCallScheduler, setShowCallScheduler] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [callHistoryClient, setCallHistoryClient] = useState<Client | null>(null);
  const [schedulerClient, setSchedulerClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAllClients, setShowAllClients] = useState(false);

  // Filter clients for current user
  const filteredClients = clients.filter(client => {
    if (client.user_account_id !== currentUser.id) return false;
    
    // Search filter
    if (searchTerm && !client.nom.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !client.prenom.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !client.telephone.includes(searchTerm)) {
      return false;
    }
    
    // Status filter
    if (statusFilter === 'pending' && client.is_completed) return false;
    if (statusFilter === 'completed' && !client.is_completed) return false;
    
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = showAllClients 
    ? filteredClients 
    : filteredClients.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const pendingCount = clients.filter(client => 
    client.user_account_id === currentUser.id && !client.is_completed
  ).length;
  
  const completedCount = clients.filter(client => 
    client.user_account_id === currentUser.id && client.is_completed
  );
  
  const upcomingCalls = getUpcomingCalls(2); // Next 2 hours
  const unreadComments = getUnreadComments();

  const handleEditClient = async (client: Client) => {
    try {
      // Fetch the complete client data including files
      const fullClientData = await fetchClientWithFiles(client.id);
      setSelectedClient(fullClientData);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching client details:', error);
      alert('Erreur lors du chargement des détails du client');
    }
  };

  const handleSaveClient = async (clientData: Partial<Client>) => {
    if (!selectedClient) return;
    
    try {
      // Agents can only update comments and files
      const updateData: Partial<Client> = {
        agent_comments: clientData.agent_comments,
        files: clientData.files
      };
      
      await updateClient(selectedClient.id, updateData);
      
      // Add activity log
      await addActivityLog({
        client_id: selectedClient.id,
        action: 'Commentaire ajouté',
        details: `Agent ${currentUser.username} a ajouté un commentaire`,
        timestamp: new Date().toISOString(),
        user_name: currentUser.username
      });
      
      setShowEditModal(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleNewClientSuccess = () => {
    setShowNewClientForm(false);
    refetch(); // Refresh the client list
    alert('Client ajouté avec succès!');
  };

  const handleScheduleCall = (client: Client) => {
    setSchedulerClient(client);
    setShowCallScheduler(true);
  };

  const handleShowCallHistory = (client: Client) => {
    setCallHistoryClient(client);
    setShowCallHistory(true);
  };

  const handleClearOldHistory = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer l\'historique des appels de plus de 30 jours ?')) {
      try {
        await clearOldCallHistory(30);
        alert('Ancien historique supprimé avec succès');
        window.location.reload(); // Refresh to show changes
      } catch (error) {
        console.error('Error clearing old history:', error);
        alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    }
  };

  const downloadFile = (file: any) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (showCallManagement) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Gestion des Appels</h2>
            <button
              onClick={() => setShowCallManagement(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Retour à mes clients
            </button>
          </div>
          <CallManagement />
        </div>
      </div>
    );
  }

  if (showNewClientForm) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Nouveau Client</h2>
            <button
              onClick={() => setShowNewClientForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Retour à mes clients
            </button>
          </div>
          <AgentForm onSuccess={handleNewClientSuccess} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Start Button */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Bienvenue, {currentUser.full_name}</h2>
            <p className="text-blue-100">Commencez par ajouter un nouveau client ou gérer vos clients existants</p>
          </div>
          <button
            onClick={() => setShowNewClientForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-semibold shadow-md"
          >
            <Plus className="h-5 w-5" />
            Commencer - Nouveau Client
          </button>
        </div>
      </div>

      {/* Alerts Section */}
      {(upcomingCalls.length > 0 || unreadComments.length > 0) && (
        <div className="space-y-3">
          {upcomingCalls.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-5 w-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-800">
                  Appels à venir dans les 2 prochaines heures ({upcomingCalls.length})
                </h3>
              </div>
              <div className="space-y-2">
                {upcomingCalls.slice(0, 3).map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-2 bg-yellow-100 rounded text-sm">
                    <div>
                      <span className="font-medium">
                        {call.clients?.prenom} {call.clients?.nom}
                      </span>
                      <span className="text-gray-600 ml-2">
                        {new Date(call.scheduled_date).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowCallManagement(true)}
                      className="px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors"
                    >
                      Gérer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {unreadComments.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800">
                  Nouveaux commentaires de l'admin ({unreadComments.length})
                </h3>
              </div>
              <div className="space-y-2">
                {unreadComments.slice(0, 2).map((comment) => (
                  <div key={comment.id} className="p-2 bg-blue-100 rounded text-sm">
                    <p className="text-blue-800">{comment.comment}</p>
                    <p className="text-blue-600 text-xs mt-1">
                      {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Mes Clients ({filteredClients.length})
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCallManagement(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Phone className="h-4 w-4" />
              Appels
            </button>
            <button
              onClick={handleClearOldHistory}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Nettoyer historique
            </button>
            <button
              onClick={() => setShowNewClientForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nouveau Client
            </button>
          </div>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Clients</p>
                <p className="text-2xl font-bold text-blue-900">{clients.filter(c => c.user_account_id === currentUser.id).length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">En Attente</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Terminés</p>
                <p className="text-2xl font-bold text-green-900">{completedCount.length}</p>
              </div>
              <Save className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'completed')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="completed">Terminés</option>
            </select>
          </div>
        </div>

        {/* Show All / Pagination Toggle */}
        {filteredClients.length > itemsPerPage && (
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setShowAllClients(!showAllClients)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showAllClients
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {showAllClients ? 'Afficher avec pagination' : `Voir tous les clients (${filteredClients.length})`}
            </button>
          </div>
        )}

        {filteredClients.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date d'effet</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {client.prenom} {client.nom}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {client.telephone}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {new Date(client.nouvelle_adhesion.dateEffet).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          client.is_completed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {client.is_completed ? 'Terminé' : 'En cours'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleShowCallHistory(client)}
                            className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-md text-xs hover:bg-purple-700 transition-colors"
                            title="Historique des appels"
                          >
                            <History className="h-3 w-3" />
                            Historique
                          </button>
                          <button
                            onClick={() => handleScheduleCall(client)}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md text-xs hover:bg-green-700 transition-colors"
                            title="Programmer un appel"
                          >
                            <Calendar className="h-3 w-3" />
                            Appel
                          </button>
                          <button
                            onClick={() => handleEditClient(client)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                            Modifier
                          </button>
                          {client.files && client.files.length > 0 && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                              <FileText className="h-3 w-3" />
                              {client.files.length} doc(s)
                            </span>
                          )}
                        </div>
                      </td>
                      {client.agent_comments && (
                        <td className="px-4 py-4 text-sm" colSpan={5}>
                          <ExpandableComments 
                            comments={client.agent_comments} 
                            maxLength={100}
                            className="bg-yellow-50 p-3 rounded-lg border border-yellow-200"
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && !showAllClients && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredClients.length)} sur {filteredClients.length} clients
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && (
                      <>
                        <span className="px-2 py-2">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className={`px-3 py-2 rounded-lg ${
                            currentPage === totalPages
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium">
              {searchTerm || statusFilter !== 'all' ? 'Aucun client trouvé' : 'Aucun client'}
            </p>
            <p className="text-sm">
              {searchTerm || statusFilter !== 'all' 
                ? 'Essayez de modifier vos critères de recherche' 
                : 'Vos clients apparaîtront ici'}
            </p>
          </div>
        )}
      </div>

      {/* Client Edit Modal */}
      {showEditModal && selectedClient && (
        <ClientEditModal
          client={selectedClient}
          onClose={() => {
            setShowEditModal(false);
            setSelectedClient(null);
          }}
          onSave={handleSaveClient}
          isAdmin={false} // Agents can edit but with limited permissions
        />
      )}

      {/* Call Scheduler Modal */}
      {showCallScheduler && (
        <CallScheduler
          onClose={() => {
            setShowCallScheduler(false);
            setSchedulerClient(null);
          }}
          preselectedClient={schedulerClient || undefined}
        />
      )}

      {/* Call History Modal */}
      {showCallHistory && callHistoryClient && (
        <CallHistoryModal
          client={callHistoryClient}
          onClose={() => {
            setShowCallHistory(false);
            setCallHistoryClient(null);
          }}
        />
      )}
    </div>
  );
};

export default AgentClientView;