import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserProfile } from '../services/authService';
import axios from 'axios';

interface User {
  name: string;
  email: string;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Calling getUserProfile...');
        const userProfile = await getUserProfile();
        setUser({
          name: userProfile.name || '',
          email: userProfile.email || '',
          role: userProfile.role || 'user'
        });
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        setError('Failed to authenticate user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/anomalies?limit=20&page=1', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setAnomalies(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch anomalies:', error);
      }
    };

    fetchAnomalies();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      // Implement your login logic here
      const userProfile = await getUserProfile(); // This should be replaced with actual login API call
      setUser({
        name: userProfile.name || '',
        email: userProfile.email || '',
        role: userProfile.role || 'user'
      });
      setError(null);
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    // Implement your logout logic here (e.g., clear tokens, etc.)
  };

  const updateUser = (newUser: User) => setUser(newUser);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 