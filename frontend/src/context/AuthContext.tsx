import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (name: string, email: string, rolePreference: string, userType: 'seeker' | 'recruiter', password?: string) => Promise<void>;
  logout: () => void;
  demoLogin: (role: 'seeker' | 'recruiter' | 'admin') => Promise<void>;
  switchMode: (newMode: 'seeker' | 'recruiter' | 'admin') => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('resumeai_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const formatUser = (u: User | null): User | null => {
    if (!u) return null;
    const name = u.name
      ? u.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      : '';
    const activeMode = (localStorage.getItem('resumeai_active_mode') as 'seeker' | 'recruiter' | 'admin') || u.userType;
    return { ...u, name, userType: activeMode };
  };

  const refreshUser = async () => {
    const curToken = token || localStorage.getItem('resumeai_token');
    if (curToken) {
      try {
        const res = await authApi.getMe();
        if (res.user) {
          const formatted = formatUser(res.user);
          setUser(formatted);
          if (formatted) localStorage.setItem('resumeai_user', JSON.stringify(formatted));
        }
      } catch (err) {
        console.error('Failed to refresh user profile:', err);
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.user) {
            const formatted = formatUser(res.user);
            setUser(formatted);
            if (formatted) localStorage.setItem('resumeai_user', JSON.stringify(formatted));
          }
        } catch {
          const savedUser = localStorage.getItem('resumeai_user');
          if (savedUser) {
            try {
              setUser(formatUser(JSON.parse(savedUser)));
            } catch {}
          } else {
            localStorage.removeItem('resumeai_token');
            setToken(null);
          }
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  useEffect(() => {
    const syncUser = async () => {
      const savedUser = localStorage.getItem('resumeai_user');
      if (savedUser) setUser(formatUser(JSON.parse(savedUser)));
      await refreshUser();
    };
    window.addEventListener('resumeai-subscription-updated', syncUser);
    window.addEventListener('resumeai-user-updated', syncUser);
    return () => {
      window.removeEventListener('resumeai-subscription-updated', syncUser);
      window.removeEventListener('resumeai-user-updated', syncUser);
    };
  }, [token]);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(email, password);
      const formatted = formatUser(data.user);
      localStorage.setItem('resumeai_token', data.token);
      if (formatted) localStorage.setItem('resumeai_user', JSON.stringify(formatted));
      setToken(data.token);
      setUser(formatted);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, rolePreference: string, userType: 'seeker' | 'recruiter', password?: string) => {
    setIsLoading(true);
    try {
      const data = await authApi.signup(name, email, rolePreference, userType, password);
      const formatted = formatUser(data.user);
      localStorage.setItem('resumeai_token', data.token);
      if (formatted) localStorage.setItem('resumeai_user', JSON.stringify(formatted));
      setToken(data.token);
      setUser(formatted);
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: 'seeker' | 'recruiter' | 'admin') => {
    const demoEmail = role === 'admin' ? 'admin@resumeai.com' : role === 'recruiter' ? 'recruiter@techscale.com' : 'alex.rivera@example.com';
    await login(demoEmail);
  };

  const logout = () => {
    localStorage.removeItem('resumeai_token');
    localStorage.removeItem('resumeai_user');
    localStorage.removeItem('resumeai_active_mode');

    // Clean up all cached user items on logout
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('resumeai_cache_') || key.startsWith('resumeai_user_activity_')) {
          localStorage.removeItem(key);
        }
      });
    } catch {}

    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event('resumeai-user-updated'));
  };

  const switchMode = (newMode: 'seeker' | 'recruiter' | 'admin') => {
    if (user) {
      localStorage.setItem('resumeai_active_mode', newMode);
      const updatedUser = { ...user, userType: newMode };
      setUser(updatedUser);
      localStorage.setItem('resumeai_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('resumeai-subscription-updated'));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      logout,
      demoLogin,
      switchMode,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
