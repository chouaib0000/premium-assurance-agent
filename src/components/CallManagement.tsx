import React, { useState, useEffect } from 'react';
import { Phone, Calendar, Clock, CheckCircle, XCircle, AlertTriangle, Plus, Edit, Trash2, MessageSquare, Volume2, Play, Pause, Filter, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useScheduledCalls } from '../hooks/useScheduledCalls';
import { useAuth } from '../hooks/useAuth';
import CallScheduler from './CallScheduler';
import CallNotes from './CallNotes';
import SubscriptionFormModal from './SubscriptionFormModal';

const CallManagement: React.FC = () => {
  const { user } = useAuth();
  const { scheduledCalls, updateScheduledCall, deleteScheduledCall, getUpcomingCalls, getTodaysCalls } = useScheduledCalls();
  const [showScheduler, setShowScheduler] = useState(false);
  const [showCallNotes, setShowCallNotes] = useState<any>(null);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<{[key: string]: HTMLAudioElement}>({});
  const [expandedCall, setExpandedCall] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Auto-refresh every minute to update alerts
  useEffect(() => {
    const interval = setInterval(() => {
      // This will trigger a re-render to update time-based alerts
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const upcomingCalls = getUpcomingCalls(2); // Next 2 hours
  const todaysCalls = getTodaysCalls();

  const getFilteredCalls = () => {
    let filtered = [];
    
    switch (filter) {
      case 'today':
        filtered = todaysCalls;
        break;
      case 'upcoming':
        filtered = scheduledCalls.filter(call => 
          new Date(call.scheduled_date) > new Date() && call.status === 'scheduled'
        );
        break;
      case 'completed':
        filtered = scheduledCalls.filter(call => call.status === 'completed');
        break;
      default:
        filtered = scheduledCalls;
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(call =>
        call.clients?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.clients?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.clients?.telephone?.includes(searchTerm) ||
        call.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getCallStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'missed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getCallTypeLabel = (type: string) => {
    switch (type) {
      case 'initial':
        return 'Initial';
      case 'follow_up':
        return 'Suivi';
      case 'closing':
        return 'Finalisation';
      default:
        return type;
    }
  };

  const isCallSoon = (scheduledDate: string) => {
    const callTime = new Date(scheduledDate);
    const now = new Date();
    const diffMinutes = (callTime.getTime() - now.getTime()) / (1000 * 60);
    return diffMinutes <= 30 && diffMinutes > 0;
  };

  const playAudio = (audioSrc: string, key: string) => {
    if (playingAudio === key) {
      // Stop current audio
      if (audioElements[key]) {
        audioElements[key].pause();
      }
      setPlayingAudio(null);
    } else {
      // Stop any currently playing audio
      if (playingAudio && audioElements[playingAudio]) {
        audioElements[playingAudio].pause();
      }
      
      // Create or get audio element
      let audio = audioElements[key];
      if (!audio) {
        audio = new Audio(audioSrc);
        audio.addEventListener('ended', () => {
          setPlayingAudio(null);
        });
        audio.addEventListener('error', () => {
          alert('Erreur lors de la lecture du fichier audio');
          setPlayingAudio(null);
        });
        setAudioElements(prev => ({ ...prev, [key]: audio }));
      }
      
      // Play audio
      audio.play().then(() => {
        setPlayingAudio(key);
      }).catch(() => {
        alert('Impossible de lire ce fichier audio');
      });
    }
  };

  const handleCompleteCall = async (call: any, outcome: string) => {
    try {
      await updateScheduledCall(call.id, {
        status: 'completed',
        outcome,
        completed_at: new Date().toISOString()
      });
      
      if (outcome === 'subscription_confirmed') {
        setShowSubscriptionForm(call);
      }
    } catch (error) {
      console.error('Error completing call:', error);
      alert('Erreur lors de la finalisation de l\'appel');
    }
  };

  const handleDeleteCall = async (callId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet appel programmé ?')) {
      try {
        await deleteScheduledCall(callId);
      } catch (error) {
        console.error('Error deleting call:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const toggleCallExpansion = (callId: string) => {
    setExpandedCall(expandedCall === callId ? null : callId);
  };

  const filteredCalls = getFilteredCalls();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Alerts for upcoming calls */}
      {upcomingCalls.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0" />
            <h3 className="font-semibold text-yellow-800 text-sm sm:text-base">
              Appels à venir dans les 2 prochaines heures ({upcomingCalls.length})
            </h3>
          </div>
          <div className="space-y-2">
            {upcomingCalls.map((call) => (
              <div key={call.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 bg-yellow-100 rounded text-sm">
                <div className="flex-1">
                  <span className="font-medium">
                    {call.clients?.prenom} {call.clients?.nom}
                  </span>
                  <span className="text-gray-600 ml-2 block sm:inline">
                    {new Date(call.scheduled_date).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <button
                  onClick={() => setShowCallNotes(call)}
                  className="px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors self-start sm:self-auto"
                >
                  Démarrer l'appel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call Management Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
            Gestion des Appels
          </h2>
          <button
            onClick={() => setShowScheduler(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            {isMobile ? 'Programmer' : 'Programmer un Appel'}
          </button>
        </div>

        {/* Statistics - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-700">Aujourd'hui</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-900">{todaysCalls.length}</p>
              </div>
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-yellow-700">À venir</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-900">
                  {scheduledCalls.filter(c => c.status === 'scheduled').length}
                </p>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-700">Terminés</p>
                <p className="text-lg sm:text-2xl font-bold text-green-900">
                  {scheduledCalls.filter(c => c.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-red-700">Manqués</p>
                <p className="text-lg sm:text-2xl font-bold text-red-900">
                  {scheduledCalls.filter(c => c.status === 'missed').length}
                </p>
              </div>
              <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Search and Filters - Responsive Layout */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {[
              { key: 'all', label: 'Tous' },
              { key: 'today', label: 'Aujourd\'hui' },
              { key: 'upcoming', label: 'À venir' },
              { key: 'completed', label: 'Terminés' }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === filterOption.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calls List - Responsive Cards */}
        <div className="space-y-3 sm:space-y-4">
          {filteredCalls.map((call) => (
            <div
              key={call.id}
              className={`border rounded-lg transition-all duration-200 ${
                isCallSoon(call.scheduled_date) ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'
              } ${expandedCall === call.id ? 'shadow-md' : 'hover:shadow-sm'}`}
            >
              {/* Main Call Info */}
              <div className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Header with name and status */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                        {call.clients?.prenom} {call.clients?.nom}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getCallStatusColor(call.status)}`}>
                          {call.status === 'scheduled' ? 'Programmé' : 
                           call.status === 'completed' ? 'Terminé' :
                           call.status === 'missed' ? 'Manqué' : 'Annulé'}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          {getCallTypeLabel(call.call_type)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Call details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">
                          {new Date(call.scheduled_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span>
                          {new Date(call.scheduled_date).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{call.clients?.telephone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    {/* Expand/Collapse button */}
                    {(call.notes || (call.audio_files && call.audio_files.length > 0) || call.outcome) && (
                      <button
                        onClick={() => toggleCallExpansion(call.id)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title={expandedCall === call.id ? "Réduire" : "Développer"}
                      >
                        {expandedCall === call.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    )}

                    {/* Main actions */}
                    <div className="flex gap-1 sm:gap-2">
                      {call.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => setShowCallNotes(call)}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                            title="Démarrer l'appel"
                          >
                            <Phone className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCall(call.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
                      {call.status === 'completed' && call.outcome === 'subscription_confirmed' && (
                        <button
                          onClick={() => setShowSubscriptionForm(call)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Formulaire de souscription"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedCall === call.id && (
                <div className="border-t border-gray-200 p-3 sm:p-4 bg-gray-50">
                  {/* Notes */}
                  {call.notes && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        Notes
                      </h4>
                      <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border">{call.notes}</p>
                    </div>
                  )}

                  {/* Audio Files */}
                  {call.audio_files && call.audio_files.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <Volume2 className="h-4 w-4" />
                        Fichiers Audio ({call.audio_files.length})
                      </h4>
                      <div className="space-y-2">
                        {call.audio_files.map((audioFile: any, audioIndex: number) => (
                          <div key={audioIndex} className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Volume2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <span className="text-xs sm:text-sm text-purple-700 block truncate">
                                  {audioFile.name}
                                </span>
                                {audioFile.isRecorded && (
                                  <span className="text-xs text-red-600 block">Enregistré</span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => playAudio(audioFile.data, `${call.id}-${audioIndex}`)}
                              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                                playingAudio === `${call.id}-${audioIndex}`
                                  ? 'text-red-600 hover:text-red-700 bg-red-50'
                                  : 'text-green-600 hover:text-green-700 bg-green-50'
                              }`}
                              title={playingAudio === `${call.id}-${audioIndex}` ? "Arrêter" : "Lire"}
                            >
                              {playingAudio === `${call.id}-${audioIndex}` ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Outcome */}
                  {call.outcome && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Résultat</h4>
                      <span className="inline-block px-3 py-1 bg-white border rounded-lg text-sm text-gray-700">
                        {call.outcome === 'interested' ? 'Intéressé' :
                         call.outcome === 'not_interested' ? 'Pas intéressé' :
                         call.outcome === 'callback_requested' ? 'Rappel demandé' :
                         call.outcome === 'subscription_confirmed' ? 'Souscription confirmée' : call.outcome}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {filteredCalls.length === 0 && (
            <div className="text-center py-8 sm:py-12 text-gray-500">
              <Phone className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-base sm:text-lg font-medium">Aucun appel trouvé</p>
              <p className="text-sm">
                {filter === 'all' && !searchTerm ? 'Programmez votre premier appel' : 
                 searchTerm ? 'Aucun appel ne correspond à votre recherche' :
                 'Aucun appel pour ce filtre'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showScheduler && (
        <CallScheduler onClose={() => setShowScheduler(false)} />
      )}

      {showCallNotes && (
        <CallNotes
          call={showCallNotes}
          onClose={() => setShowCallNotes(null)}
          onComplete={handleCompleteCall}
        />
      )}

      {showSubscriptionForm && (
        <SubscriptionFormModal
          call={showSubscriptionForm}
          onClose={() => setShowSubscriptionForm(null)}
        />
      )}
    </div>
  );
};

export default CallManagement;