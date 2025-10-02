import React, { useState, useEffect } from 'react';
import { Users, FileText, UserPlus, LogOut, Download, Search, CheckCircle, Clock, AlertTriangle, Eye, Trash2, Settings, ArrowLeft, Phone, X, MessageCircle, Briefcase } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useClients } from './hooks/useClients';
import { useActivityLogs } from './hooks/useActivityLogs';
import { useCallHistory } from './hooks/useCallHistory';
import AgentForm from './components/AgentForm';
import LoginView from './components/LoginView';
import AgentClientView from './components/AgentClientView';
import ClientEditModal from './components/ClientEditModal';
import ActivityLogModal from './components/ActivityLogModal';
import UserAccountManager from './components/UserAccountManager';
import AgentManagementPanel from './components/AgentManagementPanel';
import ExpandableComments from './components/ExpandableComments';
import LeadManagement from './components/LeadManagement';
import AgentLeadsView from './components/AgentLeadsView';
import MessagingSystem from './components/MessagingSystem';
import { authService } from './lib/auth';
import { useMessages } from './hooks/useMessages';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import type { Database } from './lib/supabase';

type Client = Database['public']['Tables']['clients']['Row'];

interface UserAccountCardProps {
  account: any;
  userClients: Client[];
  completedClients: Client[];
  pendingClients: Client[];
  recentClients: Client[];
  clientsToShow: Client[];
  isShowingAll: boolean;
  hasMoreClients: boolean;
  onToggleShowAll: () => void;
  onEditClient: (client: Client) => void;
  onMarkCompleted: (clientId: string) => void;
}

const UserAccountCard: React.FC<UserAccountCardProps> = ({
  account,
  userClients,
  completedClients,
  pendingClients,
  recentClients,
  clientsToShow,
  isShowingAll,
  hasMoreClients,
  onToggleShowAll,
  onEditClient,
  onMarkCompleted
}) => (
  <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="font-semibold text-gray-800">
          {account.full_name} ({account.username})
        </h3>
        <div className="flex flex-wrap gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">{userClients.length} total</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">{completedClients.length} terminés</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600">{pendingClients.length} en attente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-gray-600">{recentClients.length} récents (7j)</span>
          </div>
        </div>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs ${
        account.is_active 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {account.is_active ? 'Actif' : 'Inactif'}
      </span>
    </div>
    
    {userClients.length > 0 ? (
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Clients en attente */}
          {pendingClients.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  En attente ({pendingClients.length})
                </h4>
                {hasMoreClients && (
                  <button
                    onClick={onToggleShowAll}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      isShowingAll
                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isShowingAll ? 'Voir moins' : `Voir tous (${pendingClients.length})`}
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {clientsToShow.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded text-xs">
                    <div>
                      <span className="font-medium">{client.prenom} {client.nom}</span>
                      <span className="text-gray-500 ml-2">{client.telephone}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEditClient(client)}
                        className="p-1 text-blue-600 hover:text-blue-700"
                        title="Voir"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onMarkCompleted(client.id)}
                        className="p-1 text-green-600 hover:text-green-700"
                        title="Terminer"
                      >
                        <CheckCircle className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {!isShowingAll && hasMoreClients && (
                  <div className="text-center text-xs text-gray-500 py-2">
                    ... et {pendingClients.length - 5} autres clients en attente
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Clients récents */}
          {recentClients.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Récents - 7 jours ({recentClients.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {recentClients.slice(0, 5).map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-2 bg-purple-50 rounded text-xs">
                    <div>
                      <span className="font-medium">{client.prenom} {client.nom}</span>
                      <span className="text-gray-500 ml-2">
                        {new Date(client.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <button
                      onClick={() => onEditClient(client)}
                      className="p-1 text-blue-600 hover:text-blue-700"
                      title="Voir"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {recentClients.length > 5 && (
                  <div className="text-center text-xs text-gray-500 py-2">
                    ... et {recentClients.length - 5} autres clients récents
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    ) : (
      <p className="text-sm text-gray-500 text-center py-4">Aucun client pour cet utilisateur</p>
    )}
  </div>
);

function App() {
  const { isAuthenticated, user, isAdmin, loading, login, logout } = useAuth();
  const { clients, loading: clientsLoading, deleteClient, markClientAsCompleted, updateClient, refetch, fetchClientWithFiles } = useClients();
  const { activityLogs, addActivityLog } = useActivityLogs();
  const { clearOldCallHistory, tableExists: callHistoryTableExists } = useCallHistory();
  const { unreadCount } = useMessages();

  const [currentView, setCurrentView] = useState<'form' | 'login' | 'admin' | 'agent' | 'leads' | 'messages' | 'agentLeads'>('login');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showUserManager, setShowUserManager] = useState(false);
  const [showAgentManager, setShowAgentManager] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  const [showAgentForm, setShowAgentForm] = useState(true);
  const [showAllClients, setShowAllClients] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    // Set view based on authentication status
    if (isAuthenticated && user) {
      if (isAdmin) {
        setCurrentView('admin');
      } else {
        setCurrentView('agent');
      }
    } else {
      setCurrentView('login');
    }
  }, [isAuthenticated, user, isAdmin]);

  useEffect(() => {
    const getUserAccounts = async () => {
      if (isAuthenticated && isAdmin) {
        try {
          const accounts = await authService.getUserAccounts();
          setUserAccounts(accounts);
        } catch (error) {
          console.error('Error fetching user accounts:', error);
          setUserAccounts([]);
        }
      }
    };

    getUserAccounts();
  }, [isAuthenticated, isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginUsername, loginPassword);
      setLoginUsername('');
      setLoginPassword('');
    } catch (error) {
      alert('Identifiants incorrects');
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentView('login');
  };

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await deleteClient(clientId);
        
        // Add activity log
        await addActivityLog({
          client_id: null,
          action: 'Client supprimé',
          details: `Client supprimé par ${user?.username || 'admin'}`,
          timestamp: new Date().toISOString(),
          user_name: user?.username || 'admin'
        });
        
        alert('Client supprimé avec succès');
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleMarkCompleted = async (clientId: string) => {
    try {
      await markClientAsCompleted(clientId);
      
      // Add activity log
      await addActivityLog({
        client_id: clientId,
        action: 'Client terminé',
        details: `Client marqué comme terminé par ${user?.username || 'admin'}`,
        timestamp: new Date().toISOString(),
        user_name: user?.username || 'admin'
      });
      
      alert('Client marqué comme terminé');
    } catch (error) {
      console.error('Error marking client as completed:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (currentView === 'login') {
    return (
      <LoginView
        loginUsername={loginUsername}
        setLoginUsername={setLoginUsername}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        onLogin={handleLogin}
        onBackToAgent={() => {
          setCurrentView('form');
          setShowAgentForm(true);
        }}
      />
    );
  }

  if (currentView === 'agent' && isAuthenticated && user && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <img 
                  src="/logo (1).png" 
                  alt="Premium Assurances" 
                  className="h-8 w-auto"
                />
                <h1 className="text-xl font-semibold text-gray-800">
                  Espace Agent - {user.full_name}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowAgentForm(true)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Nouveau Client
                </button>
                <button
                  onClick={() => setCurrentView('agentLeads')}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Briefcase className="h-4 w-4" />
                  Mes Leads
                </button>
                <button
                  onClick={() => setCurrentView('messages')}
                  className="relative flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Messages
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {showAgentForm ? (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Nouveau Client</h2>
                  <button
                    onClick={() => setShowAgentForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Voir mes clients
                  </button>
                </div>
                <AgentForm onSuccess={() => {
                  setShowAgentForm(false);
                  alert('Client ajouté avec succès!');
                }} />
              </div>
            </div>
          ) : (
            <AgentClientView currentUser={user} />
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'admin' && isAuthenticated && isAdmin) {
    const filteredClients = clients.filter(client =>
      (searchTerm === '' ||
       client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
       client.prenom.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (dateStart === '' || new Date(client.created_at) >= new Date(dateStart)) &&
      (dateEnd === '' || new Date(client.created_at) <= new Date(dateEnd + 'T23:59:59'))
    );

    const getClientsByDateRange = (days: number) => {
      const now = new Date();
      const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      
      return clients.filter(client => {
        const effectDate = new Date(client.nouvelle_adhesion?.dateEffet);
        return effectDate <= targetDate && effectDate >= now;
      });
    };

    const urgentClients = getClientsByDateRange(3);
    const upcomingClients = getClientsByDateRange(5).filter(client => 
      !urgentClients.includes(client)
    );
    const recentClients = clients.filter(client => {
      const createdDate = new Date(client.created_at);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return createdDate >= sevenDaysAgo;
    });

    const exportToExcel = () => {
      try {
        const exportData = filteredClients.map(client => ({
          'Nom': client.nom || '',
          'Prénom': client.prenom || '',
          'Date de naissance': client.date_naissance ? new Date(client.date_naissance).toLocaleDateString('fr-FR') : '',
          'Téléphone': client.telephone || '',
          'Adresse': client.adresse || '',
          'IBAN': client.iban || '',
          'Mutuelle actuelle': client.mutuelle_actuelle?.nom || '',
          'Numéro contrat actuel': client.mutuelle_actuelle?.numero_contrat || '',
          'Nouvelle mutuelle': client.nouvelle_adhesion?.mutuelle || '',
          'Date d\'effet': client.nouvelle_adhesion?.dateEffet ? new Date(client.nouvelle_adhesion.dateEffet).toLocaleDateString('fr-FR') : '',
          'Cotisation': client.nouvelle_adhesion?.cotisation ? `${client.nouvelle_adhesion.cotisation}€` : '',
          'Résiliation': client.resiliation || '',
          'Agent': client.agent || '',
          'Statut': client.is_completed ? 'Terminé' : 'En cours',
          'Date de création': new Date(client.created_at).toLocaleDateString('fr-FR'),
          'Commentaires agent': client.agent_comments || '',
          'Conjoint nom': client.conjoint?.nom || '',
          'Conjoint prénom': client.conjoint?.prenom || '',
          'Conjoint date naissance': client.conjoint?.date_naissance ? new Date(client.conjoint.date_naissance).toLocaleDateString('fr-FR') : '',
          'Conjoint sécurité sociale': client.conjoint?.numero_securite_sociale || '',
          'Nombre enfants': client.enfants ? client.enfants.length : 0,
          'Enfants détails': client.enfants && client.enfants.length > 0 
            ? client.enfants.map((enfant: any, index: number) => 
                `Enfant ${index + 1}: ${enfant.prenom || ''} ${enfant.nom || ''} (${enfant.date_naissance ? new Date(enfant.date_naissance).toLocaleDateString('fr-FR') : 'N/A'}, ${enfant.sexe || 'N/A'})`
              ).join('; ')
            : '',
          'Nombre de documents': client.files ? client.files.length : 0
        }));

        if (exportData.length === 0) {
          alert('Aucune donnée à exporter');
          return;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // Auto-size columns
        const colWidths = [];
        const headers = Object.keys(exportData[0]);
        
        headers.forEach((header, index) => {
          let maxWidth = header.length;
          exportData.forEach(row => {
            const cellValue = String(row[header] || '');
            maxWidth = Math.max(maxWidth, cellValue.length);
          });
          colWidths[index] = { wch: Math.min(maxWidth + 2, 50) }; // Max width of 50 chars
        });
        
        ws['!cols'] = colWidths;
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Clients');
        
        const fileName = `clients_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        console.log(`Excel file exported: ${fileName}`);
      } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Erreur lors de l\'export Excel. Vérifiez la console pour plus de détails.');
      }
    };

    const exportToPDF = () => {
      window.print();
    };

    const exportToRAR = async () => {
      try {
        const zip = new JSZip();
        
        for (const client of filteredClients) {
          // Create folder for each client
          const clientFolderName = `${client.prenom}_${client.nom}`;
          const clientFolder = zip.folder(clientFolderName);
          
          if (!clientFolder) continue;
          
          // Create client information text file
          const clientInfo = `
INFORMATIONS CLIENT
==================

Nom: ${client.nom}
Prénom: ${client.prenom}
Date de naissance: ${new Date(client.date_naissance).toLocaleDateString('fr-FR')}
Téléphone: ${client.telephone}
Adresse: ${client.adresse}
IBAN: ${client.iban || 'Non renseigné'}

SITUATION FAMILIALE
==================
${client.conjoint ? `
Conjoint:
- Nom: ${client.conjoint.nom || 'Non renseigné'}
- Prénom: ${client.conjoint.prenom || 'Non renseigné'}
- Date de naissance: ${client.conjoint.date_naissance ? new Date(client.conjoint.date_naissance).toLocaleDateString('fr-FR') : 'Non renseigné'}
- N° Sécurité Sociale: ${client.conjoint.numero_securite_sociale || 'Non renseigné'}
` : 'Aucun conjoint'}

${client.enfants && client.enfants.length > 0 ? `
Enfants:
${client.enfants.map((enfant: any, index: number) => `
Enfant ${index + 1}:
- Nom: ${enfant.nom || 'Non renseigné'}
- Prénom: ${enfant.prenom || 'Non renseigné'}
- Date de naissance: ${enfant.date_naissance ? new Date(enfant.date_naissance).toLocaleDateString('fr-FR') : 'Non renseigné'}
- Sexe: ${enfant.sexe || 'Non renseigné'}
- N° Sécurité Sociale: ${enfant.numero_securite_sociale || 'Non renseigné'}
`).join('')}
` : 'Aucun enfant'}

MUTUELLE ACTUELLE
================
Nom: ${client.mutuelle_actuelle?.nom || 'Non renseigné'}
Numéro de contrat: ${client.mutuelle_actuelle?.numero_contrat || 'Non renseigné'}

NOUVELLE ADHÉSION
================
Mutuelle: ${client.nouvelle_adhesion?.mutuelle || 'Non renseigné'}
Date d'effet: ${client.nouvelle_adhesion?.dateEffet ? new Date(client.nouvelle_adhesion.dateEffet).toLocaleDateString('fr-FR') : 'Non renseigné'}
Cotisation: ${client.nouvelle_adhesion?.cotisation || 'Non renseigné'}€

RÉSILIATION
===========
Gestion: ${client.resiliation}

INFORMATIONS SYSTÈME
===================
Agent: ${client.agent}
Statut: ${client.is_completed ? 'Terminé' : 'En cours'}
Date de création: ${new Date(client.created_at).toLocaleDateString('fr-FR')}
${client.completed_at ? `Date de finalisation: ${new Date(client.completed_at).toLocaleDateString('fr-FR')}` : ''}
${client.completed_by ? `Finalisé par: ${client.completed_by}` : ''}

COMMENTAIRES AGENT
==================
${client.agent_comments || 'Aucun commentaire'}
          `.trim();
          
          // Add client info file
          clientFolder.file('informations_client.txt', clientInfo);
          
          // Add client files if they exist
          if (client.files && Array.isArray(client.files) && client.files.length > 0) {
            const filesFolder = clientFolder.folder('documents');
            
            if (filesFolder) {
              client.files.forEach((file: any, index: number) => {
                try {
                  if (file.data && file.name) {
                    // Convert base64 to binary
                    const base64Data = file.data.split(',')[1];
                    if (base64Data) {
                      filesFolder.file(file.name, base64Data, { base64: true });
                    }
                  }
                } catch (error) {
                  console.error(`Error adding file ${file.name}:`, error);
                }
              });
            }
          }
        }
        
        // Generate and download the ZIP file
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `clients_export_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
      } catch (error) {
        console.error('Error creating ZIP file:', error);
        alert('Erreur lors de la création du fichier ZIP');
      }
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-4">
                  <img 
                    src="/logo (1).png" 
                    alt="Premium Assurances" 
                    className="h-8 w-auto"
                  />
                  <h1 className="text-xl font-semibold text-gray-800">Panel d'Administration</h1>
                </div>
                
                <div className="flex gap-6">
                  <button
                    onClick={() => setShowUserManager(true)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    Comptes
                  </button>
                  <button
                    onClick={() => setShowAgentManager(true)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    Agents
                  </button>
                  <button
                    onClick={async () => {
                      if (!callHistoryTableExists) {
                        alert('La fonctionnalité d\'historique des appels n\'est pas disponible.');
                        return;
                      }
                      
                      if (window.confirm('Êtes-vous sûr de vouloir supprimer l\'historique des appels de plus de 30 jours ?')) {
                        try {
                          await clearOldCallHistory(30);
                          alert('Ancien historique supprimé avec succès');
                          // Refresh the page to reflect changes
                          window.location.reload();
                        } catch (error) {
                          console.error('Error clearing old history:', error);
                          alert('Erreur lors de la suppression de l\'ancien historique');
                        }
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Nettoyer historique
                  </button>
                  <button
                    onClick={() => setShowActivityModal(true)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Journal
                  </button>
                  <button
                    onClick={() => setCurrentView('form')}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    Nouveau Client
                  </button>
                  <button
                    onClick={() => setCurrentView('leads')}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Briefcase className="h-4 w-4" />
                    Leads
                  </button>
                  <button
                    onClick={() => setCurrentView('messages')}
                    className="relative flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Messages
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Start Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Tableau de Bord Administrateur</h2>
                <p className="text-blue-100">Commencez par ajouter un nouveau client ou gérer les leads</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentView('form')}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-semibold shadow-md"
                >
                  <UserPlus className="h-5 w-5" />
                  Commencer - Nouveau Client
                </button>
                <button
                  onClick={() => setCurrentView('leads')}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors font-semibold shadow-md border-2 border-white"
                >
                  <Briefcase className="h-5 w-5" />
                  Gérer les Leads
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Comptes Utilisateurs</p>
                  <p className="text-3xl font-bold text-gray-900">{userAccounts.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Clients</p>
                  <p className="text-3xl font-bold text-gray-900">{clients.length}</p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Récents (7j)</p>
                  <p className="text-3xl font-bold text-gray-900">{recentClients.length}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">À venir (3-5j)</p>
                  <p className="text-3xl font-bold text-gray-900">{upcomingClients.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Urgent (3j)</p>
                  <p className="text-3xl font-bold text-gray-900">{urgentClients.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* User Accounts Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Aperçu des Comptes Utilisateurs</h2>
            <div className="space-y-6">
              {userAccounts.map((account) => {
                const userClients = clients.filter(client => client.user_account_id === account.id);
                const completedClients = userClients.filter(client => client.is_completed);
                const pendingClients = userClients.filter(client => !client.is_completed);
                const recentClients = userClients.filter(client => {
                  const createdDate = new Date(client.created_at);
                  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  return createdDate >= sevenDaysAgo;
                });

                const isShowingAll = showAllClients[account.id] || false;
                const clientsToShow = isShowingAll ? pendingClients : pendingClients.slice(0, 5);
                const hasMoreClients = pendingClients.length > 5;

                return (
                  <UserAccountCard
                    key={account.id}
                    account={account}
                    userClients={userClients}
                    completedClients={completedClients}
                    pendingClients={pendingClients}
                    recentClients={recentClients}
                    clientsToShow={clientsToShow}
                    isShowingAll={isShowingAll}
                    hasMoreClients={hasMoreClients}
                    onToggleShowAll={() => setShowAllClients(prev => ({
                      ...prev,
                      [account.id]: !prev[account.id]
                    }))}
                    onEditClient={handleEditClient}
                    onMarkCompleted={handleMarkCompleted}
                  />
                );
              })}
            </div>
          </div>

          {/* All Clients Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Tous les clients</h2>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou prénom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                  />
                </div>
                
                <div className="flex gap-2">
                  <div>
                    <input
                      type="date"
                      placeholder="Date début"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      title="Date de début"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      placeholder="Date fin"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      title="Date de fin"
                    />
                  </div>
                  {(dateStart || dateEnd) && (
                    <button
                      onClick={() => {
                        setDateStart('');
                        setDateEnd('');
                      }}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Effacer les dates"
                    >
                      Effacer
                    </button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Excel
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </button>
                  <button
                    onClick={exportToRAR}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    ZIP
                  </button>
                </div>
              </div>
            </div>

            {clientsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredClients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prénom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de naissance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mutuelle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Résiliation</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date inscription</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredClients.map((client) => (
                      <React.Fragment key={client.id}>
                        <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {client.nom}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.prenom}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(client.date_naissance).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.telephone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.mutuelle_actuelle?.nom || client.nouvelle_adhesion?.mutuelle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.resiliation}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(client.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {client.agent}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditClient(client)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Voir"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClient(client.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                        {client.agent_comments && (
                          <tr>
                            <td colSpan={9} className="px-6 py-4">
                              <ExpandableComments 
                                comments={client.agent_comments} 
                                maxLength={200}
                                className="bg-yellow-50 p-4 rounded-lg border border-yellow-200"
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium">Aucun client trouvé</p>
                <p className="text-sm">
                  {searchTerm || dateStart || dateEnd ? 'Aucun client ne correspond à vos critères de recherche' : 'Les clients apparaîtront ici une fois ajoutés'}
                </p>
              </div>
            )}
          </div>

          {/* Urgent Adhesions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Adhésions effectives dans 0-3 jours ({urgentClients.length})
            </h2>
            
            {urgentClients.length > 0 ? (
              <div className="space-y-3">
                {urgentClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <span className="font-medium text-gray-900">
                        {client.prenom} {client.nom}
                      </span>
                      <span className="text-gray-600 ml-2">
                        - Date d'effet: {new Date(client.nouvelle_adhesion?.dateEffet).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClient(client)}
                        className="text-blue-600 hover:text-blue-700"
                        title="Voir"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleMarkCompleted(client.id)}
                        className="text-green-600 hover:text-green-700"
                        title="Terminer"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium">Aucune adhésion urgente</p>
                <p className="text-sm">Aucune adhésion effective dans les 0-3 prochains jours</p>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showEditModal && selectedClient && (
          <ClientEditModal
            client={selectedClient}
            onClose={() => {
              setShowEditModal(false);
              setSelectedClient(null);
            }}
            onSave={async (clientData) => {
              try {
                await updateClient(selectedClient.id, clientData);
                
                // Add activity log
                await addActivityLog({
                  client_id: selectedClient.id,
                  action: 'Client modifié',
                  details: `Client ${selectedClient.prenom} ${selectedClient.nom} modifié par ${user?.username || 'admin'}`,
                  timestamp: new Date().toISOString(),
                  user_name: user?.username || 'admin'
                });
                
                alert('Client modifié avec succès');
              } catch (error) {
                console.error('Error updating client:', error);
                alert('Erreur lors de la modification');
              }
              setShowEditModal(false);
              setSelectedClient(null);
              refetch();
            }}
            isAdmin={true}
          />
        )}

        {showActivityModal && (
          <ActivityLogModal
            activityLogs={activityLogs}
            onClose={() => setShowActivityModal(false)}
          />
        )}

        {showUserManager && (
          <UserAccountManager
            onClose={() => setShowUserManager(false)}
          />
        )}

        {showAgentManager && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">Gestion des Agents</h2>
                  <button
                    onClick={() => setShowAgentManager(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <AgentManagementPanel />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Leads Management (Admin only)
  if (currentView === 'leads' && isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <img
                  src="/logo (1).png"
                  alt="Premium Assurances"
                  className="h-8 w-auto"
                />
                <h1 className="text-xl font-semibold text-gray-800">Lead Management</h1>
              </div>
              <button
                onClick={() => setCurrentView('admin')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour Admin
              </button>
            </div>
          </div>
        </nav>
        <LeadManagement />
      </div>
    );
  }

  // Agent Leads View
  if (currentView === 'agentLeads' && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <img
                  src="/logo (1).png"
                  alt="Premium Assurances"
                  className="h-8 w-auto"
                />
                <h1 className="text-xl font-semibold text-gray-800">Mes Leads</h1>
              </div>
              <button
                onClick={() => setCurrentView('agent')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
            </div>
          </div>
        </nav>
        <AgentLeadsView />
      </div>
    );
  }

  // Messaging System
  if (currentView === 'messages') {
    return (
      <div className="h-screen flex flex-col">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <img
                  src="/logo (1).png"
                  alt="Premium Assurances"
                  className="h-8 w-auto"
                />
                <h1 className="text-xl font-semibold text-gray-800">Messages</h1>
              </div>
              <button
                onClick={() => setCurrentView(isAdmin ? 'admin' : 'agent')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
            </div>
          </div>
        </nav>
        <MessagingSystem />
      </div>
    );
  }

  // Agent form view (accessible from admin panel)
  if (currentView === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <img
                src="/logo (1).png"
                alt="Premium Assurances"
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-3xl font-bold text-white">Premium Assurances</h1>
                <p className="text-blue-200">Formulaire de souscription</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated && user && (
                <div className="flex items-center gap-4">
                  <div className="text-white text-sm">
                    Connecté: {user.full_name}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setCurrentView('admin')}
                      className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Retour Admin
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <AgentForm onSuccess={() => {
              alert('Client enregistré avec succès !');
            }} />
          </div>
        </div>
      </div>
    );
  }
}

export default App;