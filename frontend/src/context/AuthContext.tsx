'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { apiRequest, getAuthToken, setAuthToken, removeAuthToken } from '@/lib/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (userData: {
    name: string;
    email: string;
    password: string;
    confirm_password: string;
    phone?: string;
  }) => Promise<User>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { success, error } = useToast();

  const fetchCurrentUser = useCallback(async () => {
    const savedToken = getAuthToken();
    if (!savedToken) {
      setIsLoading(false);
      return;
    }
    setToken(savedToken);
    try {
      const userData = await apiRequest<User>('/auth/me');
      setUser(userData);
    } catch {
      removeAuthToken();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const res = await apiRequest<{ access_token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAuthToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      success('Login successful! Welcome back.');
      return res.user;
    } catch (err: any) {
      const msg = err.message || 'Invalid email or password.';
      error(msg);
      throw err;
    }
  };

  const signup = async (userData: {
    name: string;
    email: string;
    password: string;
    confirm_password: string;
    phone?: string;
  }): Promise<User> => {
    try {
      const res = await apiRequest<{ access_token: string; user: User }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      setAuthToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      success('Account created successfully! Welcome to Airbnb.');
      return res.user;
    } catch (err: any) {
      const msg = err.message || 'Signup failed. Please check your information.';
      error(msg);
      throw err;
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await apiRequest<User>('/auth/me');
      setUser(userData);
    } catch {
      // ignore
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setToken(null);
    success('Logged out successfully.');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
