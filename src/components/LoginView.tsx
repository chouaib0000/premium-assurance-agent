import React from 'react';
import { Shield } from 'lucide-react';

interface LoginViewProps {
  loginUsername: string;
  setLoginUsername: (value: string) => void;
  loginPassword: string;
  setLoginPassword: (value: string) => void;
  onLogin: (e: React.FormEvent) => void;
  onBackToAgent: () => void;
}

const LoginView: React.FC<LoginViewProps> = React.memo(({
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  onLogin,
  onBackToAgent
}) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
      <div className="text-center mb-8">
        <img 
          src="/logo (1).png" 
          alt="Premium Assurances" 
          className="h-16 w-auto mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-gray-800">Accès Superviseur</h1>
        <p className="text-gray-600 mt-2">Connectez-vous pour accéder au panel d'administration</p>
      </div>
      
      <form onSubmit={onLogin} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nom d'utilisateur</label>
          <input
            type="text"
            required
            autoComplete="username"
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Entrez votre nom d'utilisateur"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Entrez votre mot de passe"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Se connecter
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Connectez-vous avec vos identifiants personnels
        </p>
      </div>
    </div>
  </div>
));

LoginView.displayName = 'LoginView';

export default LoginView;