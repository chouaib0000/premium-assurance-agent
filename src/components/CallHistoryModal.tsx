import React, { useState, useEffect } from 'react';
import { Phone, Clock, MessageSquare, Plus, Trash2, X, Calendar, User } from 'lucide-react';
import { useCallHistory } from '../hooks/useCallHistory';
import { useAuth } from '../hooks/useAuth';
import type { Database } from '../lib/supabase';

type Client = Database['public']['Tables']['clients']['Row'];

interface CallHistoryModalProps {
  client: Client;
  onClose: () => void;
}

const CallHistoryModal: React.FC<CallHistoryModalProps> = ({ client, onClose }) => {
  const { user } = useAuth();
  const { callHistory, addCallHistory, deleteCallHistory, fetchCallHistory, loading } = useCallHistory();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    call_date: new Date().toISOString().slice(0, 16),
    duration_minutes: 5,
    call_type: 'initial' as 'initial' | 'follow_up' | 'closing' | 'information',
    outcome: '' as 'interested' | 'not_interested' | 'callback_requested' | 'subscription_confirmed' | 'no_answer' | 'busy' | '',
    notes: ''
  });

  useEffect(() => {
    if (client.id) {
      fetchCallHistory(client.id);
    }
  }, [client.id]);

  const clientCallHistory = callHistory.filter(call => call.client_id === client.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addCallHistory({
        client_id: client.id,
        agent_id: user.id,
        call_date: formData.call_date,
        duration_minutes: formData.duration_minutes,
        call_type: formData.call_type,
        outcome: formData.outcome || null,
        notes: formData.notes || null
      });

      setFormData({
        call_date: new Date().toISOString().slice(0, 16),
        duration_minutes: 5,
        call_type: 'initial',
        outcome: '',
        notes: ''
      });
      setShowAddForm(false);
      alert('Appel ajouté à l\'historique!');
    } catch (error) {
      console.error('Error adding call history:', error);
      alert('Erreur lors de l\'ajout de l\'appel');
    }
  };

  const handleDelete = async (callId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet appel de l\'historique ?')) {
      try {
        await deleteCallHistory(callId);
        alert('Appel supprimé de l\'historique');
      } catch (error) {
        console.error('Error deleting call:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const getCallTypeLabel = (type: string) => {
    switch (type) {
      case 'initial': return 'Initial';
      case 'follow_up': return 'Suivi';
      case 'closing': return 'Finalisation';
      case 'information': return 'Information';
      default: return type;
    }
  };

  const getOutcomeLabel = (outcome: string | null) => {
    if (!outcome) return 'Non défini';
    switch (outcome) {
      case 'interested': return 'Intéressé';
      case 'not_interested': return 'Pas intéressé';
      case 'callback_requested': return 'Rappel demandé';
      case 'subscription_confirmed': return 'Souscription confirmée';
      case 'no_answer': return 'Pas de réponse';
      case 'busy': return 'Occupé';
      default: return outcome;
    }
  };

  const getOutcomeColor = (outcome: string | null) => {
    if (!outcome) return 'bg-gray-100 text-gray-800';
    switch (outcome) {
      case 'interested': return 'bg-green-100 text-green-800';
      case 'not_interested': return 'bg-red-100 text-red-800';
      case 'callback_requested': return 'bg-yellow-100 text-yellow-800';
      case 'subscription_confirmed': return 'bg-blue-100 text-blue-800';
      case 'no_answer': return 'bg-gray-100 text-gray-800';
      case 'busy': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Historique des appels - {client.prenom} {client.nom}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{client.telephone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{clientCallHistory.length} appel(s)</span>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Ajouter un appel
            </button>
          </div>

          {showAddForm && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ajouter un appel à l'historique</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date et heure de l'appel
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.call_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, call_date: e.target.value }))}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durée (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type d'appel
                    </label>
                    <select
                      value={formData.call_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, call_type: e.target.value as any }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="initial">Appel initial</option>
                      <option value="follow_up">Suivi</option>
                      <option value="closing">Finalisation</option>
                      <option value="information">Information</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Résultat
                    </label>
                    <select
                      value={formData.outcome}
                      onChange={(e) => setFormData(prev => ({ ...prev, outcome: e.target.value as any }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sélectionner un résultat</option>
                      <option value="interested">Intéressé</option>
                      <option value="not_interested">Pas intéressé</option>
                      <option value="callback_requested">Rappel demandé</option>
                      <option value="subscription_confirmed">Souscription confirmée</option>
                      <option value="no_answer">Pas de réponse</option>
                      <option value="busy">Occupé</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    placeholder="Notes sur l'appel..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ajouter l'appel
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : clientCallHistory.length > 0 ? (
            <div className="space-y-4">
              {clientCallHistory.map((call) => (
                <div key={call.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {new Date(call.call_date).toLocaleDateString('fr-FR')} à {new Date(call.call_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{call.duration_minutes} min</span>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {getCallTypeLabel(call.call_type)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getOutcomeColor(call.outcome)}`}>
                        {getOutcomeLabel(call.outcome)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(call.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Supprimer cet appel"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {call.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5" />
                        <p className="text-sm text-gray-700">{call.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium">Aucun appel dans l'historique</p>
              <p className="text-sm">Les appels apparaîtront ici une fois ajoutés</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallHistoryModal;