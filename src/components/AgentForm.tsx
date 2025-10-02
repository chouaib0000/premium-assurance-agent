import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useClients } from '../hooks/useClients';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { useCallHistory } from '../hooks/useCallHistory';
import { Calendar, Phone, User, Building, FileText, CreditCard, MapPin, Users, Plus, Trash2, History } from 'lucide-react';

interface AgentFormProps {
  onSuccess?: () => void;
}

interface Enfant {
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe: 'Homme' | 'Femme' | '';
  numero_securite_sociale: string;
}

export default function AgentForm({ onSuccess }: AgentFormProps) {
  const { user } = useAuth();
  const { addClient } = useClients();
  const { addActivityLog } = useActivityLogs();
  const { addCallHistory } = useCallHistory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasConjoint, setHasConjoint] = useState(false);
  const [hasEnfants, setHasEnfants] = useState(false);
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [callHistoryEntries, setCallHistoryEntries] = useState<Array<{
    call_date: string;
    duration_minutes: number;
    call_type: 'initial' | 'follow_up' | 'closing' | 'information';
    outcome: 'interested' | 'not_interested' | 'callback_requested' | 'subscription_confirmed' | 'no_answer' | 'busy' | '';
    notes: string;
  }>>([]);
  
  const [formData, setFormData] = useState({
    // Informations du client
    nom: '',
    prenom: '',
    date_naissance: '',
    telephone: '',
    adresse: '',
    
    // Numéro de sécurité sociale
    numero_securite_sociale: '',
    
    // Situation familiale - Conjoint
    conjoint_nom: '',
    conjoint_prenom: '',
    conjoint_date_naissance: '',
    conjoint_numero_securite_sociale: '',
    
    // IBAN
    iban: '',
    
    // Mutuelle actuelle
    mutuelle_actuelle: '',
    numero_contrat: '',
    
    // Nouvelle adhésion
    date_effet: '',
    cotisation: '',
    nouvelle_mutuelle: '',
    
    // Résiliation
    resiliation: 'Cabinet' as 'Cabinet' | 'Compagnie',
    
    // Comments
    agent_comments: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addEnfant = () => {
    setEnfants(prev => [...prev, {
      nom: '',
      prenom: '',
      date_naissance: '',
      sexe: '' as 'Homme' | 'Femme' | '',
      numero_securite_sociale: ''
    }]);
  };

  const removeEnfant = (index: number) => {
    setEnfants(prev => prev.filter((_, i) => i !== index));
  };

  const updateEnfant = (index: number, field: keyof Enfant, value: string) => {
    setEnfants(prev => prev.map((enfant, i) => 
      i === index ? { ...enfant, [field]: value } : enfant
    ));
  };

  const addCallHistoryEntry = () => {
    setCallHistoryEntries(prev => [...prev, {
      call_date: new Date().toISOString().slice(0, 16),
      duration_minutes: 5,
      call_type: 'initial',
      outcome: '',
      notes: ''
    }]);
  };

  const removeCallHistoryEntry = (index: number) => {
    setCallHistoryEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateCallHistoryEntry = (index: number, field: string, value: any) => {
    setCallHistoryEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      date_naissance: '',
      telephone: '',
      adresse: '',
      conjoint_nom: '',
      conjoint_prenom: '',
      conjoint_date_naissance: '',
      conjoint_numero_securite_sociale: '',
      iban: '',
      mutuelle_actuelle: '',
      numero_contrat: '',
      date_effet: '',
      cotisation: '',
      nouvelle_mutuelle: '',
      resiliation: 'Cabinet',
      agent_comments: ''
    });
    setHasConjoint(false);
    setHasEnfants(false);
    setEnfants([]);
    setFiles([]);
    setCallHistoryEntries([]);
    setShowCallHistory(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Convert files to base64
      const filePromises = files.map(async (file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              data: reader.result,
              uploadedAt: new Date().toISOString()
            });
          };
          reader.readAsDataURL(file);
        });
      });
      
      const filesData = await Promise.all(filePromises);

      // Prepare client data
      const clientData = {
        nom: formData.nom,
        prenom: formData.prenom,
        date_naissance: formData.date_naissance,
        telephone: formData.telephone,
        adresse: formData.adresse,
        numero_securite_sociale: formData.numero_securite_sociale,
        conjoint: hasConjoint ? {
          nom: formData.conjoint_nom,
          prenom: formData.conjoint_prenom,
          date_naissance: formData.conjoint_date_naissance,
          numero_securite_sociale: formData.conjoint_numero_securite_sociale
        } : null,
        enfants: hasEnfants ? enfants : [],
        mutuelle_actuelle: {
          nom: formData.mutuelle_actuelle,
          numero_contrat: formData.numero_contrat
        },
        nouvelle_adhesion: {
          mutuelle: formData.nouvelle_mutuelle,
          dateEffet: formData.date_effet,
          cotisation: formData.cotisation
        },
        resiliation: formData.resiliation,
        agent: user.full_name || user.username,
        user_account_id: user.id,
        iban: formData.iban,
        files: filesData,
        agent_comments: formData.agent_comments
      };

      const newClient = await addClient(clientData);

      // Add call history entries if any
      for (const callEntry of callHistoryEntries) {
        if (callEntry.call_date && callEntry.duration_minutes > 0) {
          await addCallHistory({
            client_id: newClient.id,
            agent_id: user.id,
            call_date: callEntry.call_date,
            duration_minutes: callEntry.duration_minutes,
            call_type: callEntry.call_type,
            outcome: callEntry.outcome || null,
            notes: callEntry.notes || null
          });
        }
      }

      // Log the activity
      await addActivityLog({
        client_id: newClient.id,
        action: 'Client créé',
        details: `Nouveau client ajouté: ${formData.prenom} ${formData.nom}`,
        timestamp: new Date().toISOString(),
        user_name: user.username
      });

      resetForm();
      onSuccess?.();
      alert('Client enregistré avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du client:', error);
      alert('Erreur lors de l\'ajout du client');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. Informations du Client */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-3">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            1. Informations du Client
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom *
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom *
              </label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de naissance *
              </label>
              <input
                type="date"
                name="date_naissance"
                value={formData.date_naissance}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Téléphone *
              </label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              N° Sécurité Sociale
            </label>
            <input
              type="text"
              name="numero_securite_sociale"
              value={formData.numero_securite_sociale}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Numéro de sécurité sociale"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Adresse postale *
            </label>
            <textarea
              name="adresse"
              value={formData.adresse}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Adresse complète..."
            />
          </div>
        </div>

        {/* 2. Situation familiale */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-3">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            2. Situation familiale
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Conjoint(e) ?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasConjoint"
                  checked={hasConjoint}
                  onChange={() => setHasConjoint(true)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                Oui
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasConjoint"
                  checked={!hasConjoint}
                  onChange={() => setHasConjoint(false)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                Non
              </label>
            </div>
          </div>

          {hasConjoint && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du conjoint
                </label>
                <input
                  type="text"
                  name="conjoint_nom"
                  value={formData.conjoint_nom}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom du conjoint
                </label>
                <input
                  type="text"
                  name="conjoint_prenom"
                  value={formData.conjoint_prenom}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de naissance du conjoint
                </label>
                <input
                  type="date"
                  name="conjoint_date_naissance"
                  value={formData.conjoint_date_naissance}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  N° Sécurité Sociale
                </label>
                <input
                  type="text"
                  name="conjoint_numero_securite_sociale"
                  value={formData.conjoint_numero_securite_sociale}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Enfants */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-3">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            3. Enfants
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Enfants ?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasEnfants"
                  checked={hasEnfants}
                  onChange={() => setHasEnfants(true)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                Oui
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasEnfants"
                  checked={!hasEnfants}
                  onChange={() => {
                    setHasEnfants(false);
                    setEnfants([]);
                  }}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                Non
              </label>
            </div>
          </div>

          {hasEnfants && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={addEnfant}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter un enfant
              </button>

              {enfants.map((enfant, index) => (
                <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-800">Enfant {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeEnfant(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={enfant.nom}
                        onChange={(e) => updateEnfant(index, 'nom', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={enfant.prenom}
                        onChange={(e) => updateEnfant(index, 'prenom', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de naissance
                      </label>
                      <input
                        type="date"
                        value={enfant.date_naissance}
                        onChange={(e) => updateEnfant(index, 'date_naissance', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sexe
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`enfant_sexe_${index}`}
                            value="Homme"
                            checked={enfant.sexe === 'Homme'}
                            onChange={(e) => updateEnfant(index, 'sexe', e.target.value as 'Homme' | 'Femme')}
                            className="mr-2 text-blue-600 focus:ring-blue-500"
                          />
                          Homme
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={`enfant_sexe_${index}`}
                            value="Femme"
                            checked={enfant.sexe === 'Femme'}
                            onChange={(e) => updateEnfant(index, 'sexe', e.target.value as 'Homme' | 'Femme')}
                            className="mr-2 text-blue-600 focus:ring-blue-500"
                          />
                          Femme
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        N° Sécurité Sociale
                      </label>
                      <input
                        type="text"
                        value={enfant.numero_securite_sociale}
                        onChange={(e) => updateEnfant(index, 'numero_securite_sociale', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. IBAN */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-3">
            <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
            4. IBAN
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IBAN
            </label>
            <input
              type="text"
              name="iban"
              value={formData.iban}
              onChange={handleInputChange}
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Mutuelle Actuelle */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-3">
            <Building className="w-5 h-5 mr-2 text-blue-600" />
            Mutuelle Actuelle
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la mutuelle *
              </label>
              <input
                type="text"
                name="mutuelle_actuelle"
                value={formData.mutuelle_actuelle}
                onChange={handleInputChange}
                required
                placeholder="Entrez le nom de la mutuelle"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de contrat
              </label>
              <input
                type="text"
                name="numero_contrat"
                value={formData.numero_contrat}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* 5. Nouvelle Adhésion */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-3">
            <Building className="w-5 h-5 mr-2 text-blue-600" />
            5. Nouvelle Adhésion
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="w-4 h-4 inline mr-1" />
                Nouvelle mutuelle *
              </label>
              <input
                type="text"
                name="nouvelle_mutuelle"
                value={formData.nouvelle_mutuelle}
                onChange={handleInputChange}
                required
                placeholder="Nom de la nouvelle mutuelle"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date d'effet *
              </label>
              <input
                type="date"
                name="date_effet"
                value={formData.date_effet}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-1" />
                Cotisation mensuelle (€) *
              </label>
              <input
                type="number"
                name="cotisation"
                value={formData.cotisation}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* 6. Résiliation */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-3">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            6. Résiliation
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choix de gestion
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="resiliation"
                  value="Cabinet"
                  checked={formData.resiliation === 'Cabinet'}
                  onChange={handleInputChange}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                Gérer via Cabinet
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="resiliation"
                  value="Compagnie"
                  checked={formData.resiliation === 'Compagnie'}
                  onChange={handleInputChange}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                Gérer via Compagnie
              </label>
            </div>
          </div>
        </div>

        {/* Call History Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-3">
              <History className="w-5 h-5 mr-2 text-blue-600" />
              Historique des appels (optionnel)
            </h2>
            <button
              type="button"
              onClick={() => setShowCallHistory(!showCallHistory)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showCallHistory 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {showCallHistory ? 'Masquer' : 'Ajouter des appels'}
            </button>
          </div>
          
          {showCallHistory && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={addCallHistoryEntry}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter un appel
              </button>

              {callHistoryEntries.map((entry, index) => (
                <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-800">Appel {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeCallHistoryEntry(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date et heure
                      </label>
                      <input
                        type="datetime-local"
                        value={entry.call_date}
                        onChange={(e) => updateCallHistoryEntry(index, 'call_date', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                        value={entry.duration_minutes}
                        onChange={(e) => updateCallHistoryEntry(index, 'duration_minutes', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type d'appel
                      </label>
                      <select
                        value={entry.call_type}
                        onChange={(e) => updateCallHistoryEntry(index, 'call_type', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                        value={entry.outcome}
                        onChange={(e) => updateCallHistoryEntry(index, 'outcome', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={entry.notes}
                        onChange={(e) => updateCallHistoryEntry(index, 'notes', e.target.value)}
                        rows={3}
                        placeholder="Notes sur cet appel..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {callHistoryEntries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium">Aucun appel dans l'historique</p>
                  <p className="text-sm">Cliquez sur "Ajouter un appel" pour commencer</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Réinitialiser
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <User className="w-4 h-4 mr-2" />
                Enregistrer le client
              </>
            )}
          </button>
        </div>
      </form>
        {/* Upload Files Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-3">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Documents
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Télécharger des documents
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp3,.wav,.m4a,.aac,.ogg"
              onChange={(e) => {
                if (e.target.files) {
                  const selectedFiles = Array.from(e.target.files);
                  setFiles(prev => [...prev, ...selectedFiles]);
                  // Clear the input so the same files can be selected again if needed
                  e.target.value = '';
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <p className="text-sm text-gray-500 mt-2">
              Formats acceptés: PDF, DOC, DOCX, JPG, JPEG, PNG, MP3, WAV, M4A, AAC, OGG. Vous pouvez sélectionner plusieurs fichiers à la fois. Les fichiers s'ajoutent à votre sélection précédente.
            </p>
            {files.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Fichiers sélectionnés:</p>
                <div className="space-y-1">
                  {files.map((file, index) => (
                    <div key={index} className="text-sm text-gray-600 flex items-center justify-between gap-2 p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                        <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                        className="text-red-600 hover:text-red-700"
                        title="Supprimer ce fichier"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setFiles([])}
                  className="mt-2 text-sm text-red-600 hover:text-red-700"
                >
                  Supprimer tous les fichiers
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-3">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            7. Commentaires
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentaires de l'agent
            </label>
            <textarea
              name="agent_comments"
              value={formData.agent_comments}
              onChange={handleInputChange}
              rows={4}
              placeholder="Ajoutez vos commentaires sur ce client..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
    </div>
  );
}