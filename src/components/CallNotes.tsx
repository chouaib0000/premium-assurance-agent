import React, { useState } from 'react';
import { Phone, Save, X, CheckCircle, XCircle, RotateCcw, FileText, Volume2, Play, Pause } from 'lucide-react';
import { useScheduledCalls } from '../hooks/useScheduledCalls';

interface CallNotesProps {
  call: any;
  onClose: () => void;
  onComplete: (call: any, outcome: string) => void;
}

const CallNotes: React.FC<CallNotesProps> = ({ call, onClose, onComplete }) => {
  const { updateScheduledCall } = useScheduledCalls();
  const [notes, setNotes] = useState(call.notes || '');
  const [outcome, setOutcome] = useState('');
  const [loading, setLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<{[key: string]: HTMLAudioElement}>({});

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

  const handleSaveNotes = async () => {
    setLoading(true);
    try {
      await updateScheduledCall(call.id, { notes });
      alert('Notes sauvegardées');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteCall = async (selectedOutcome: string) => {
    if (!selectedOutcome) {
      alert('Veuillez sélectionner un résultat');
      return;
    }

    setLoading(true);
    try {
      await updateScheduledCall(call.id, { notes });
      onComplete(call, selectedOutcome);
      onClose();
    } catch (error) {
      console.error('Error completing call:', error);
      alert('Erreur lors de la finalisation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Appel en cours - {call.clients?.prenom} {call.clients?.nom}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Call Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Informations de l'appel</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Client:</span> {call.clients?.prenom} {call.clients?.nom}
              </div>
              <div>
                <span className="font-medium">Téléphone:</span> {call.clients?.telephone}
              </div>
              <div>
                <span className="font-medium">Type:</span> {
                  call.call_type === 'initial' ? 'Initial' :
                  call.call_type === 'follow_up' ? 'Suivi' : 'Finalisation'
                }
              </div>
              <div>
                <span className="font-medium">Durée prévue:</span> {call.duration_minutes} min
              </div>
            </div>
          </div>

          {/* Audio Files from Call */}
          {call.audio_files && call.audio_files.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Fichiers Audio de l'Appel ({call.audio_files.length})
              </h3>
              <div className="space-y-2">
                {call.audio_files.map((audioFile: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded border border-purple-200">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-purple-500" />
                      <div>
                        <span className="text-sm font-medium text-purple-700">{audioFile.name}</span>
                        {audioFile.isRecorded && (
                          <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            Enregistré
                          </span>
                        )}
                        <p className="text-xs text-gray-500">
                          Ajouté le {new Date(audioFile.uploadedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => playAudio(audioFile.data, `call-audio-${index}`)}
                      className={`p-2 rounded-lg transition-colors ${
                        playingAudio === `call-audio-${index}`
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                      title={playingAudio === `call-audio-${index}` ? "Arrêter" : "Lire"}
                    >
                      {playingAudio === `call-audio-${index}` ? (
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

          {/* Notes Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Notes de l'appel
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder="Notez ici les détails de votre conversation avec le client..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Outcome Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Résultat de l'appel
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setOutcome('interested')}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  outcome === 'interested'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <CheckCircle className="h-5 w-5 mb-1" />
                <div className="font-medium">Intéressé</div>
                <div className="text-sm text-gray-600">Le client est intéressé par l'offre</div>
              </button>

              <button
                onClick={() => setOutcome('not_interested')}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  outcome === 'not_interested'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 hover:border-red-300'
                }`}
              >
                <XCircle className="h-5 w-5 mb-1" />
                <div className="font-medium">Pas intéressé</div>
                <div className="text-sm text-gray-600">Le client n'est pas intéressé</div>
              </button>

              <button
                onClick={() => setOutcome('callback_requested')}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  outcome === 'callback_requested'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-gray-300 hover:border-yellow-300'
                }`}
              >
                <RotateCcw className="h-5 w-5 mb-1" />
                <div className="font-medium">Rappel demandé</div>
                <div className="text-sm text-gray-600">Le client souhaite être rappelé</div>
              </button>

              <button
                onClick={() => setOutcome('subscription_confirmed')}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  outcome === 'subscription_confirmed'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <FileText className="h-5 w-5 mb-1" />
                <div className="font-medium">Souscription confirmée</div>
                <div className="text-sm text-gray-600">Le client confirme sa souscription</div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleSaveNotes}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              Sauvegarder les notes
            </button>
            
            <button
              onClick={() => handleCompleteCall(outcome)}
              disabled={loading || !outcome}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Terminer l'appel
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallNotes;