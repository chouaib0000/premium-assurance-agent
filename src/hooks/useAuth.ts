import { useState, useEffect } from 'react';
import { authService, type AuthState } from '../lib/auth';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isAdmin: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state from localStorage
    const currentAuth = authService.getCurrentUser();
    setAuthState(currentAuth);
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const newAuthState = await authService.login(username, password);
      setAuthState(newAuthState);
      return newAuthState;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      isAdmin: false
    });
  };

  return {
    ...authState,
    loading,
    login,
    logout
  };
};