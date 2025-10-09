import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await authService.getCurrentUser();
        if (response?.success) {
          setUser(response.data);
          setIsLoggedIn(true);
        }
      } catch (error) {
        // Ignore errors - just means not authenticated
        console.log('Auth initialization failed:', error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);
      if (response?.success) {
        setUser(response.data.user);
        setIsLoggedIn(true);
        return { success: true, data: response.data };
      }
      return { success: false, error: response?.message || 'Login failed' };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData, avatarFile, coverImageFile) => {
    try {
      setLoading(true);
      const response = await authService.register(userData, avatarFile, coverImageFile);
      if (response?.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response?.message || 'Registration failed' };
    } catch (error) {
      return { success: false, error: error.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    isLoggedIn,
    isAuthenticated: isLoggedIn,
    loading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
