import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (name: string, email: string, rolePreference: string, userType: 'seeker' | 'recruiter') => Promise<void>;
  logout: () => void;
  demoLogin: (role: 'seeker' | 'recruiter' | 'admin') => Promise<void>;
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
    return { ...u, name };
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          // If backend returns a user, update it
          if (res.user && res.user.name !== 'Alex Rivera') {
            const formatted = formatUser(res.user);
            setUser(formatted);
            if (formatted) localStorage.setItem('resumeai_user', JSON.stringify(formatted));
          } else {
            // Otherwise, see if we have a locally saved user
            const savedUser = localStorage.getItem('resumeai_user');
            if (savedUser) {
              setUser(JSON.parse(savedUser));
            } else {
              setUser(formatUser(res.user));
            }
          }
        } catch {
          const savedUser = localStorage.getItem('resumeai_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
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

  const signup = async (name: string, email: string, rolePreference: string, userType: 'seeker' | 'recruiter') => {
    setIsLoading(true);
    try {
      const data = await authApi.signup(name, email, rolePreference, userType);
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
    setToken(null);
    setUser(null);
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
      demoLogin
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
