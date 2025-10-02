import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Download, Trash2, Plus, Eye, Play, Pause, Volume2 } from 'lucide-react';
import type { Database } from '../lib/supabase';

type Client = Database['public']['Tables']['clients']['Row'];

interface ClientEditModalProps {
  client: Client;
  onClose: () => void;
  onSave: (clientData: Partial<Client>) => Promise<void>;
  isAdmin: boolean;
}

interface Enfant {
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe: 'Homme' | 'Femme' | '';
  numero_securite_sociale: string;
}

const ClientEditModal: React.FC<ClientEditModalProps> = ({ 
  client, 
  onClose, 
  onSave, 
  isAdmin 
}) => {
  const [hasConjoint, setHasConjoint] = useState(
    !!(client.conjoint?.nom || client.conjoint?.prenom || client.conjoint?.date_naissance || client.conjoint?.numero_securite_sociale)
  );
  const [formData, setFormData] = useState({
    nom: client.nom,
    prenom: client.prenom,
    date_naissance: client.date_naissance,
    adresse: client.adresse,
    telephone: client.telephone,
    iban: client.iban || '',
    numero_securite_sociale: client.numero_securite_sociale || '',
    agent_comments: client.agent_comments || '',
    // Conjoint fields
    conjoint_nom: client.conjoint?.nom || '',
    conjoint_prenom: client.conjoint?.prenom || '',
    conjoint_date_naissance: client.conjoint?.date_naissance || '',
    conjoint_numero_securite_sociale: client.conjoint?.numero_securite_sociale || '',
    // Mutuelle actuelle fields
    mutuelle_actuelle_nom: client.mutuelle_actuelle?.nom || '',
    mutuelle_actuelle_numero_contrat: client.mutuelle_actuelle?.numero_contrat || '',
    // Nouvelle adhésion fields
    nouvelle_adhesion_mutuelle: client.nouvelle_adhesion?.mutuelle || '',
    nouvelle_adhesion_date_effet: client.nouvelle_adhesion?.dateEffet || '',
    nouvelle_adhesion_cotisation: client.nouvelle_adhesion?.cotisation || '',
    // Résiliation
    resiliation: client.resiliation
  });

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState(client.files || []);
  const [enfants, setEnfants] = useState<Enfant[]>(client.enfants || []);
  const [viewingFile, setViewingFile] = useState<any>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<{[key: string]: HTMLAudioElement}>({});

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
    
    try {
      // Convert new files to base64
      const filePromises = newFiles.map(async (file) => {
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
      
      const newFilesData = await Promise.all(filePromises);
      const allFiles = [...existingFiles, ...newFilesData];
      
      if (isAdmin) {
        // Admin can update all fields
        const updateData = {
          nom: formData.nom,
          prenom: formData.prenom,
          date_naissance: formData.date_naissance,
          adresse: formData.adresse,
          telephone: formData.telephone,
          iban: formData.iban,
          numero_securite_sociale: formData.numero_securite_sociale,
          conjoint: (formData.conjoint_nom || formData.conjoint_prenom || formData.conjoint_date_naissance || formData.conjoint_numero_securite_sociale) ? {
            nom: formData.conjoint_nom || '',
            prenom: formData.conjoint_prenom || '',
            date_naissance: formData.conjoint_date_naissance || '',
            numero_securite_sociale: formData.conjoint_numero_securite_sociale || ''
          } : hasConjoint ? {
            nom: formData.conjoint_nom || '',
            prenom: formData.conjoint_prenom || '',
            date_naissance: formData.conjoint_date_naissance || '',
            numero_securite_sociale: formData.conjoint_numero_securite_sociale || ''
          } : null,
          enfants: enfants,
          mutuelle_actuelle: {
            nom: formData.mutuelle_actuelle_nom || '',
            numero_contrat: formData.mutuelle_actuelle_numero_contrat || ''
          },
          nouvelle_adhesion: {
            mutuelle: formData.nouvelle_adhesion_mutuelle || '',
            dateEffet: formData.nouvelle_adhesion_date_effet || '',
            cotisation: formData.nouvelle_adhesion_cotisation || ''
          },
          resiliation: formData.resiliation,
          agent_comments: formData.agent_comments,
          files: allFiles,
          updated_at: new Date().toISOString()
        };
        
        await onSave(updateData);
      } else {
        // Agent can only update comments
        await onSave({
          agent_comments: formData.agent_comments,
          files: allFiles,
          updated_at: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Erreur lors de la sauvegarde');
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

  const viewFile = (file: any) => {
    setViewingFile(file);
  };

  const isAudioFile = (file: any) => {
    return file.type?.startsWith('audio/') || 
           file.name?.toLowerCase().match(/\.(mp3|wav|m4a|aac|ogg)$/);
  };

  const toggleAudioPlayback = (file: any, index: number) => {
    const audioKey = `${file.name}-${index}`;
    
    if (playingAudio === audioKey) {
      // Pause current audio
      if (audioElements[audioKey]) {
        audioElements[audioKey].pause();
      }
      setPlayingAudio(null);
    } else {
      // Stop any currently playing audio
      if (playingAudio && audioElements[playingAudio]) {
        audioElements[playingAudio].pause();
      }
      
      // Create or get audio element
      let audio = audioElements[audioKey];
      if (!audio) {
        audio = new Audio(file.data);
        audio.addEventListener('ended', () => {
          setPlayingAudio(null);
        });
        audio.addEventListener('error', () => {
          alert('Erreur lors de la lecture du fichier audio');
          setPlayingAudio(null);
        });
        setAudioElements(prev => ({ ...prev, [audioKey]: audio }));
      }
      
      // Play audio
      audio.play().then(() => {
        setPlayingAudio(audioKey);
      }).catch(() => {
        alert('Impossible de lire ce fichier audio');
      });
    }
  };

  // Cleanup audio elements on unmount
  useEffect(() => {
    return () => {
      Object.values(audioElements).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, [audioElements]);

  const removeFile = (index: number) => {
    setExistingFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              {isAdmin ? 'Modifier le client' : 'Voir le client'}
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
          {/* Client Information - Read-only for agents */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Informations du client</h3>
            
            {isAdmin ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance</label>
                  <input
                    type="date"
                    value={formData.date_naissance}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_naissance: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IBAN</label>
                  <input
                    type="text"
                    value={formData.iban}
                    onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">N° Sécurité Sociale</label>
                  <input
                    type="text"
                    value={formData.numero_securite_sociale}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero_securite_sociale: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Numéro de sécurité sociale"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                  <textarea
                    value={formData.adresse}
                    onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                    {client.nom}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                    {client.prenom}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance</label>
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                    {new Date(client.date_naissance).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                    {client.telephone}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IBAN</label>
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                    {client.iban || 'Non renseigné'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">N° Sécurité Sociale</label>
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                    {client.numero_securite_sociale || 'Non renseigné'}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                    {client.adresse}
                  </div>
                </div>
              </div>
            )}
            
            {/* Additional Client Information */}
            <div className="mt-6 space-y-4">
              <h4 className="text-md font-semibold text-gray-800">Informations complémentaires</h4>
              
              {/* Conjoint Information */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-gray-800 mb-3">Conjoint</h5>
                
                {isAdmin && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          onChange={() => {
                            setHasConjoint(false);
                            // Clear conjoint data when selecting "Non"
                            setFormData(prev => ({
                              ...prev,
                              conjoint_nom: '',
                              conjoint_prenom: '',
                              conjoint_date_naissance: '',
                              conjoint_numero_securite_sociale: ''
                            }));
                          }}
                          className="mr-2 text-blue-600 focus:ring-blue-500"
                        />
                        Non
                      </label>
                    </div>
                  </div>
                )}
                
                {isAdmin ? (
                  hasConjoint ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                        <input
                          type="text"
                          value={formData.conjoint_nom}
                          onChange={(e) => setFormData(prev => ({ ...prev, conjoint_nom: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Nom du conjoint"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                        <input
                          type="text"
                          value={formData.conjoint_prenom}
                          onChange={(e) => setFormData(prev => ({ ...prev, conjoint_prenom: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Prénom du conjoint"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                        <input
                          type="date"
                          value={formData.conjoint_date_naissance}
                          onChange={(e) => setFormData(prev => ({ ...prev, conjoint_date_naissance: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">N° Sécurité Sociale</label>
                        <input
                          type="text"
                          value={formData.conjoint_numero_securite_sociale}
                          onChange={(e) => setFormData(prev => ({ ...prev, conjoint_numero_securite_sociale: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Numéro de sécurité sociale"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Aucun conjoint</p>
                  )
                ) : (
                  hasConjoint ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Nom:</span> {client.conjoint?.nom || 'Non renseigné'}
                      </div>
                      <div>
                        <span className="font-medium">Prénom:</span> {client.conjoint?.prenom || 'Non renseigné'}
                      </div>
                      <div>
                        <span className="font-medium">Date de naissance:</span> {
                          client.conjoint?.date_naissance 
                            ? new Date(client.conjoint.date_naissance).toLocaleDateString('fr-FR')
                            : 'Non renseigné'
                        }
                      </div>
                      <div>
                        <span className="font-medium">N° Sécurité Sociale:</span> {client.conjoint?.numero_securite_sociale || 'Non renseigné'}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Aucun conjoint</p>
                  )
                )}
              </div>
              
              {/* Enfants Information */}
              {(enfants.length > 0 || isAdmin) && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-800">Enfants ({enfants.length})</h5>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={addEnfant}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Ajouter
                      </button>
                    )}
                  </div>
                  
                  {enfants.length > 0 ? (
                    <div className="space-y-4">
                      {enfants.map((enfant, index) => (
                        <div key={index} className="border border-green-200 rounded-lg p-4 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <h6 className="font-medium text-sm text-gray-800">Enfant {index + 1}</h6>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => removeEnfant(index)}
                                className="text-red-600 hover:text-red-700"
                                title="Supprimer cet enfant"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          
                          {isAdmin ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
                                <input
                                  type="text"
                                  value={enfant.nom}
                                  onChange={(e) => updateEnfant(index, 'nom', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  placeholder="Nom de l'enfant"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Prénom</label>
                                <input
                                  type="text"
                                  value={enfant.prenom}
                                  onChange={(e) => updateEnfant(index, 'prenom', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  placeholder="Prénom de l'enfant"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Date de naissance</label>
                                <input
                                  type="date"
                                  value={enfant.date_naissance}
                                  onChange={(e) => updateEnfant(index, 'date_naissance', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Sexe</label>
                                <div className="flex gap-3">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name={`enfant_sexe_${index}`}
                                      value="Homme"
                                      checked={enfant.sexe === 'Homme'}
                                      onChange={(e) => updateEnfant(index, 'sexe', e.target.value as 'Homme' | 'Femme')}
                                      className="mr-1 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm">Homme</span>
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name={`enfant_sexe_${index}`}
                                      value="Femme"
                                      checked={enfant.sexe === 'Femme'}
                                      onChange={(e) => updateEnfant(index, 'sexe', e.target.value as 'Homme' | 'Femme')}
                                      className="mr-1 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm">Femme</span>
                                  </label>
                                </div>
                              </div>
                              
                              <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">N° Sécurité Sociale</label>
                                <input
                                  type="text"
                                  value={enfant.numero_securite_sociale}
                                  onChange={(e) => updateEnfant(index, 'numero_securite_sociale', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  placeholder="Numéro de sécurité sociale"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                              <div><span className="font-medium">Nom:</span> {enfant.nom || 'Non renseigné'}</div>
                              <div><span className="font-medium">Prénom:</span> {enfant.prenom || 'Non renseigné'}</div>
                              <div><span className="font-medium">Date de naissance:</span> {
                                enfant.date_naissance 
                                  ? new Date(enfant.date_naissance).toLocaleDateString('fr-FR')
                                  : 'Non renseigné'
                              }</div>
                              <div><span className="font-medium">Sexe:</span> {enfant.sexe || 'Non renseigné'}</div>
                              <div className="md:col-span-2"><span className="font-medium">N° Sécurité Sociale:</span> {enfant.numero_securite_sociale || 'Non renseigné'}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : isAdmin ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Aucun enfant ajouté. Cliquez sur "Ajouter" pour en ajouter un.
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">Aucun enfant</p>
                  )}
                </div>
              )}
              
              {/* Mutuelle Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-3">Mutuelle Actuelle</h5>
                  {isAdmin ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                        <input
                          type="text"
                          value={formData.mutuelle_actuelle_nom}
                          onChange={(e) => setFormData(prev => ({ ...prev, mutuelle_actuelle_nom: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Nom de la mutuelle"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">N° Contrat</label>
                        <input
                          type="text"
                          value={formData.mutuelle_actuelle_numero_contrat}
                          onChange={(e) => setFormData(prev => ({ ...prev, mutuelle_actuelle_numero_contrat: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Numéro de contrat"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Nom:</span> {client.mutuelle_actuelle?.nom || 'Non renseigné'}</div>
                      <div><span className="font-medium">N° Contrat:</span> {client.mutuelle_actuelle?.numero_contrat || 'Non renseigné'}</div>
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-3">Nouvelle Adhésion</h5>
                  {isAdmin ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mutuelle</label>
                        <input
                          type="text"
                          value={formData.nouvelle_adhesion_mutuelle}
                          onChange={(e) => setFormData(prev => ({ ...prev, nouvelle_adhesion_mutuelle: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Nom de la nouvelle mutuelle"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date d'effet</label>
                        <input
                          type="date"
                          value={formData.nouvelle_adhesion_date_effet}
                          onChange={(e) => setFormData(prev => ({ ...prev, nouvelle_adhesion_date_effet: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cotisation (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.nouvelle_adhesion_cotisation}
                          onChange={(e) => setFormData(prev => ({ ...prev, nouvelle_adhesion_cotisation: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Montant de la cotisation"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Mutuelle:</span> {client.nouvelle_adhesion?.mutuelle || 'Non renseigné'}</div>
                      <div><span className="font-medium">Date d'effet:</span> {
                        client.nouvelle_adhesion?.dateEffet 
                          ? new Date(client.nouvelle_adhesion.dateEffet).toLocaleDateString('fr-FR')
                          : 'Non renseigné'
                      }</div>
                      <div><span className="font-medium">Cotisation:</span> {client.nouvelle_adhesion?.cotisation || 'Non renseigné'}€</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Résiliation and Agent Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-3">Résiliation</h5>
                  {isAdmin ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gestion</label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="resiliation"
                            value="Cabinet"
                            checked={formData.resiliation === 'Cabinet'}
                            onChange={(e) => setFormData(prev => ({ ...prev, resiliation: e.target.value as 'Cabinet' | 'Compagnie' }))}
                            className="mr-2 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">Cabinet</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="resiliation"
                            value="Compagnie"
                            checked={formData.resiliation === 'Compagnie'}
                            onChange={(e) => setFormData(prev => ({ ...prev, resiliation: e.target.value as 'Cabinet' | 'Compagnie' }))}
                            className="mr-2 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">Compagnie</span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm">
                      <span className="font-medium">Gestion:</span> {client.resiliation}
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-2">Informations Système</h5>
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">Agent:</span> {client.agent}</div>
                    <div><span className="font-medium">Statut:</span> {client.is_completed ? 'Terminé' : 'En cours'}</div>
                    <div><span className="font-medium">Créé le:</span> {new Date(client.created_at).toLocaleDateString('fr-FR')}</div>
                    {client.completed_at && (
                      <div><span className="font-medium">Terminé le:</span> {new Date(client.completed_at).toLocaleDateString('fr-FR')}</div>
                    )}
                    {client.completed_by && (
                      <div><span className="font-medium">Terminé par:</span> {client.completed_by}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Files Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Documents</h3>
            
            {/* Existing Files */}
            {existingFiles.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-2">Fichiers existants</h4>
                <div className="space-y-2">
                  {existingFiles.map((file: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {isAudioFile(file) ? (
                          <Volume2 className="h-4 w-4 text-purple-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {isAudioFile(file) && (
                          <button
                            type="button"
                            onClick={() => toggleAudioPlayback(file, index)}
                            className={`${
                              playingAudio === `${file.name}-${index}`
                                ? 'text-red-600 hover:text-red-700'
                                : 'text-purple-600 hover:text-purple-700'
                            }`}
                            title={playingAudio === `${file.name}-${index}` ? "Arrêter" : "Lire"}
                          >
                            {playingAudio === `${file.name}-${index}` ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => viewFile(file)}
                            className="text-green-600 hover:text-green-700"
                            title="Voir le fichier"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => downloadFile(file)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-700"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Files */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ajouter de nouveaux documents
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp3,.wav,.m4a,.aac,.ogg"
                onChange={(e) => {
                  if (e.target.files) {
                    const selectedFiles = Array.from(e.target.files);
                    setNewFiles(prev => [...prev, ...selectedFiles]);
                    // Clear the input so the same files can be selected again if needed
                    e.target.value = '';
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <p className="text-sm text-gray-500 mt-2">
                Formats acceptés: PDF, DOC, DOCX, JPG, JPEG, PNG, MP3, WAV, M4A, AAC, OGG. Vous pouvez sélectionner plusieurs fichiers à la fois. Les fichiers s'ajoutent à votre sélection précédente.
              </p>
              {newFiles.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Nouveaux fichiers:</p>
                  <div className="space-y-1">
                    {newFiles.map((file, index) => (
                      <div key={index} className="text-sm text-gray-600 flex items-center justify-between gap-2 p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewFiles(prev => prev.filter((_, i) => i !== index))}
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
                    onClick={() => setNewFiles([])}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Supprimer tous les nouveaux fichiers
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentaires {!isAdmin && '(seul champ modifiable)'}
            </label>
            <textarea
              value={formData.agent_comments}
              onChange={(e) => setFormData(prev => ({ ...prev, agent_comments: e.target.value }))}
              placeholder="Ajoutez vos commentaires..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
      </div>

      {/* File Viewer Modal */}
      {viewingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-xl max-w-[95vw] w-full max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {viewingFile.name}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadFile(viewingFile)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  Télécharger
                </button>
                <button
                  onClick={() => setViewingFile(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden" style={{ minHeight: '80vh' }}>
              {viewingFile.type === 'application/pdf' || viewingFile.name.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={viewingFile.data}
                  className="w-full border-none"
                  style={{ height: '80vh', minHeight: '600px' }}
                  title={viewingFile.name}
                />
              ) : viewingFile.type.startsWith('image/') ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <img
                    src={viewingFile.data}
                    alt={viewingFile.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Aperçu non disponible pour ce type de fichier</p>
                    <button
                      onClick={() => downloadFile(viewingFile)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                    >
                      <Download className="h-4 w-4" />
                      Télécharger pour voir le contenu
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientEditModal;