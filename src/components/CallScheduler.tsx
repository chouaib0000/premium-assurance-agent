import React, { useState } from 'react';
import { Calendar, Clock, Phone, Plus, X, Save, AlertCircle, Mic, MicOff, Upload, Play, Pause, Trash2, Volume2 } from 'lucide-react';
import { useScheduledCalls } from '../hooks/useScheduledCalls';
import { useClients } from '../hooks/useClients';
import { useAuth } from '../hooks/useAuth';
import type { Database } from '../lib/supabase';

type Client = Database['public']['Tables']['clients']['Row'];

interface CallSchedulerProps {
  onClose: () => void;
  preselectedClient?: Client;
}

const CallScheduler: React.FC<CallSchedulerProps> = ({ onClose, preselectedClient }) => {
  const { user } = useAuth();
  const { clients } = useClients();
  const { addScheduledCall } = useScheduledCalls();
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<{[key: string]: HTMLAudioElement}>({});
  
  const [formData, setFormData] = useState({
    client_id: preselectedClient?.id || '',
    client_name: preselectedClient ? `${preselectedClient.prenom} ${preselectedClient.nom}` : '',
    client_phone: preselectedClient?.telephone || '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 30,
    call_type: 'initial' as 'initial' | 'follow_up' | 'closing',
    notes: ''
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Erreur lors du démarrage de l\'enregistrement. Vérifiez les permissions du microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
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

  const removeAudioFile = (index: number) => {
    setAudioFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearRecordedAudio = () => {
    setAudioBlob(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Validation: either select existing client or provide manual entry
    if (!formData.client_id && (!formData.client_name || !formData.client_phone)) {
      alert('Veuillez sélectionner un client existant ou saisir le nom et téléphone du client');
      return;
    }

    setLoading(true);
    try {
      const scheduledDateTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);
      
      // Convert audio files to base64
      const audioPromises = [];
      
      // Add recorded audio if exists
      if (audioBlob) {
        audioPromises.push(new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: `recorded_audio_${Date.now()}.wav`,
              type: 'audio/wav',
              size: audioBlob.size,
              data: reader.result,
              uploadedAt: new Date().toISOString(),
              isRecorded: true
            });
          };
          reader.readAsDataURL(audioBlob);
        }));
      }
      
      // Add uploaded audio files
      audioFiles.forEach((file) => {
        audioPromises.push(new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              data: reader.result,
              uploadedAt: new Date().toISOString(),
              isRecorded: false
            });
          };
          reader.readAsDataURL(file);
        }));
      });
      
      const audioData = await Promise.all(audioPromises);
      
      const callData = {
        client_id: formData.client_id || null,
        agent_id: user.id,
        scheduled_date: scheduledDateTime.toISOString(),
        duration_minutes: formData.duration_minutes,
        call_type: formData.call_type,
        notes: formData.client_id ? formData.notes : `${formData.notes}\n\nClient manuel: ${formData.client_name} - ${formData.client_phone}`,
        status: 'scheduled',
        audio_files: audioData
      };
      
      await addScheduledCall(callData);

      alert('Appel programmé avec succès!');
      onClose();
    } catch (error) {
      console.error('Error scheduling call:', error);
      alert('Erreur lors de la programmation de l\'appel');
    } finally {
      setLoading(false);
    }
  };

  const availableClients = clients.filter(client => 
    !preselectedClient && (!user?.id || client.user_account_id === user.id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Programmer un Appel
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {!preselectedClient && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Sélectionner un client existant (optionnel)
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, client_id: e.target.value }));
                      if (e.target.value) {
                        const selectedClient = availableClients.find(c => c.id === e.target.value);
                        if (selectedClient) {
                          setFormData(prev => ({ 
                            ...prev, 
                            client_name: `${selectedClient.prenom} ${selectedClient.nom}`,
                            client_phone: selectedClient.telephone
                          }));
                        }
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner un client</option>
                    {availableClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.prenom} {client.nom} - {client.telephone}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="text-center text-xs text-gray-500">
                  ou
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Nom du client *
                    </label>
                    <input
                      type="text"
                      value={formData.client_name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                      placeholder="Entrez le nom complet du client"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      value={formData.client_phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_phone: e.target.value }))}
                      placeholder="Numéro de téléphone"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {preselectedClient && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <p className="text-sm font-medium text-blue-800">
                Client sélectionné: {preselectedClient.prenom} {preselectedClient.nom}
              </p>
              <p className="text-sm text-blue-600">{preselectedClient.telephone}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                <Calendar className="w-3 h-3 inline mr-1" />
                Date *
              </label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                <Clock className="w-3 h-3 inline mr-1" />
                Heure *
              </label>
              <input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Type d'appel
              </label>
              <select
                value={formData.call_type}
                onChange={(e) => setFormData(prev => ({ ...prev, call_type: e.target.value as 'initial' | 'follow_up' | 'closing' }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="initial">Appel initial</option>
                <option value="follow_up">Suivi</option>
                <option value="closing">Finalisation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Durée (min)
              </label>
              <select
                value={formData.duration_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 heure</option>
              </select>
            </div>
          </div>

          {/* Audio Notes Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-gray-700">Notes Audio</h3>
            
            {/* Audio Recording */}
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-gray-700">Enregistrement Audio</h4>
                <div className="flex gap-2">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded-md text-xs hover:bg-red-700 transition-colors"
                    >
                      <Mic className="h-2 w-2" />
                      Enregistrer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded-md text-xs hover:bg-gray-700 transition-colors animate-pulse"
                    >
                      <MicOff className="h-2 w-2" />
                      Arrêter
                    </button>
                  )}
                </div>
              </div>
              
              {audioBlob && (
                <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-700">Enregistrement audio ({(audioBlob.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => playAudio(URL.createObjectURL(audioBlob), 'recorded')}
                      className={`p-1 rounded ${
                        playingAudio === 'recorded'
                          ? 'text-red-600 hover:text-red-700'
                          : 'text-green-600 hover:text-green-700'
                      }`}
                      title={playingAudio === 'recorded' ? "Arrêter" : "Lire"}
                    >
                      {playingAudio === 'recorded' ? (
                        <Pause className="h-2 w-2" />
                      ) : (
                        <Play className="h-2 w-2" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={clearRecordedAudio}
                      className="p-1 text-red-600 hover:text-red-700"
                      title="Supprimer"
                    >
                      <Trash2 className="h-2 w-2" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Audio File Upload */}
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-gray-700">Télécharger des fichiers audio</h4>
                <label className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 transition-colors cursor-pointer">
                  <Upload className="h-2 w-2" />
                  Parcourir
                  <input
                    type="file"
                    multiple
                    accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
                    onChange={(e) => {
                      if (e.target.files) {
                        const selectedFiles = Array.from(e.target.files);
                        setAudioFiles(prev => [...prev, ...selectedFiles]);
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              
              {audioFiles.length > 0 && (
                <div className="space-y-2">
                  {audioFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-3 w-3 text-blue-500" />
                        <span className="text-xs text-blue-700">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => playAudio(URL.createObjectURL(file), `file-${index}`)}
                          className={`p-1 rounded ${
                            playingAudio === `file-${index}`
                              ? 'text-red-600 hover:text-red-700'
                              : 'text-green-600 hover:text-green-700'
                          }`}
                          title={playingAudio === `file-${index}` ? "Arrêter" : "Lire"}
                        >
                          {playingAudio === `file-${index}` ? (
                            <Pause className="h-2 w-2" />
                          ) : (
                            <Play className="h-2 w-2" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAudioFile(index)}
                          className="p-1 text-red-600 hover:text-red-700"
                          title="Supprimer"
                        >
                          <Trash2 className="h-2 w-2" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                Formats acceptés: MP3, WAV, M4A, AAC, OGG et autres formats audio
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              placeholder="Notes sur l'appel..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="h-3 w-3" />
                  Programmer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CallScheduler;