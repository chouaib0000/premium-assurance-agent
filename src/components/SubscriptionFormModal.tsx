import React, { useState } from 'react';
import { FileText, Save, X, User, Building, CreditCard, MapPin, Users, Plus, Trash2 } from 'lucide-react';
import { useSubscriptionForms } from '../hooks/useSubscriptionForms';
import { useAuth } from '../hooks/useAuth';

interface SubscriptionFormModalProps {
  call: any;
  onClose: () => void;
}

interface Enfant {
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe: 'Homme' | 'Femme' | '';
  numero_securite_sociale: string;
}

const SubscriptionFormModal: React.FC<SubscriptionFormModalProps> = ({ call, onClose }) => {
  const { user } = useAuth();
  const { addSubscriptionForm } = useSubscriptionForms();
  const [loading, setLoading] = useState(false);
  const [hasConjoint, setHasConjoint] = useState(false);
  const [hasEnfants, setHasEnfants] = useState(false);
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  
  const [formData, setFormData] = useState({
    // Informations du client
    nom: call.clients?.nom || '',
    prenom: call.clients?.prenom || '',
    date_naissance: '',
    telephone: call.clients?.telephone || '',
    adresse: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const subscriptionData = {
        ...formData,
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
        }
      };

      await addSubscriptionForm({
        client_id: call.client_id,
        agent_id: user.id,
        call_id: call.id,
        form_data: subscriptionData,
        status: 'completed'
      });

      alert('Formulaire de souscription enregistré avec succès!');
      onClose();
    } catch (error) {
      console.error('Error saving subscription form:', error);
      alert('Erreur lors de l\'enregistrement du formulaire');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Formulaire de Souscription - {call.clients?.prenom} {call.clients?.nom}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* 1. Informations du Client */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-3">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              1. Informations du Client
            </h3>
            
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
            <h3 className="text-lg font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-3">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              2. Situation familiale
            </h3>
            
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

            {/* Enfants Section */}
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
                      
                      <div className="md:col-span-2">
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

          {/* 3. IBAN */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-3">
              <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
              3. IBAN
            </h3>
            
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
            <h3 className="text-lg font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-3">
              <Building className="w-5 h-5 mr-2 text-blue-600" />
              Mutuelle Actuelle
            </h3>
            
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

          {/* 4. Nouvelle Adhésion */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-3">
              <Building className="w-5 h-5 mr-2 text-blue-600" />
              4. Nouvelle Adhésion
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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

          {/* 5. Résiliation */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-3">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              5. Résiliation
            </h3>
            
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

          {/* Comments Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-3">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              6. Commentaires
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaires de l'agent
              </label>
              <textarea
                name="agent_comments"
                value={formData.agent_comments}
                onChange={handleInputChange}
                rows={4}
                placeholder="Ajoutez vos commentaires sur cette souscription..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer la souscription
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionFormModal;