import bcrypt from 'bcryptjs';
import { supabase } from './supabase';

export interface UserAccount {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserAccount | null;
  isAdmin: boolean;
}

class AuthService {
  private currentUser: UserAccount | null = null;
  private isAdmin: boolean = false;

  async login(username: string, password: string): Promise<AuthState> {
    try {
      // Check for admin login first
      if (username === 'admin' && password === 'Mido732a.') {
        this.isAdmin = true;
        this.currentUser = {
          id: 'admin',
          username: 'admin',
          full_name: 'Administrator',
          is_active: true,
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        localStorage.setItem('auth_user', JSON.stringify(this.currentUser));
        localStorage.setItem('is_admin', 'true');
        
        return {
          isAuthenticated: true,
          user: this.currentUser,
          isAdmin: true
        };
      }

      // Check user accounts in database
      const { data: userAccount, error } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error || !userAccount) {
        throw new Error('Invalid credentials');
      }

      // For now, we'll use simple password comparison
      // In production, you should hash passwords properly
      const isValidPassword = password === userAccount.password_hash || 
                             await bcrypt.compare(password, userAccount.password_hash);

      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      this.currentUser = userAccount;
      this.isAdmin = false;
      
      localStorage.setItem('auth_user', JSON.stringify(userAccount));
      localStorage.setItem('is_admin', 'false');

      return {
        isAuthenticated: true,
        user: userAccount,
        isAdmin: false
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  logout(): void {
    this.currentUser = null;
    this.isAdmin = false;
    localStorage.removeItem('auth_user');
    localStorage.removeItem('is_admin');
  }

  getCurrentUser(): AuthState {
    if (this.currentUser) {
      return {
        isAuthenticated: true,
        user: this.currentUser,
        isAdmin: this.isAdmin
      };
    }

    // Try to restore from localStorage
    const storedUser = localStorage.getItem('auth_user');
    const storedIsAdmin = localStorage.getItem('is_admin') === 'true';

    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
      this.isAdmin = storedIsAdmin;
      
      return {
        isAuthenticated: true,
        user: this.currentUser,
        isAdmin: this.isAdmin
      };
    }

    return {
      isAuthenticated: false,
      user: null,
      isAdmin: false
    };
  }

  async createUserAccount(userData: {
    username: string;
    password: string;
    full_name: string;
    email?: string;
  }): Promise<UserAccount> {
    try {
      // Hash password
      const password_hash = await bcrypt.hash(userData.password, 10);

      const { data, error } = await supabase
        .from('user_accounts')
        .insert([{
          username: userData.username,
          password_hash,
          full_name: userData.full_name,
          email: userData.email,
          created_by: this.currentUser?.username || 'admin'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user account:', error);
      throw error;
    }
  }

  async getUserAccounts(): Promise<UserAccount[]> {
    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user accounts:', error);
      throw error;
    }
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_accounts')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  async deleteUserAccount(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_accounts')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();