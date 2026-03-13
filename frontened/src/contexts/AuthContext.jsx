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
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('isAdmin') === 'true');

  const setAdminStatus = (status) => {
    setIsAdmin(status);
    if (status) {
      localStorage.setItem('isAdmin', 'true');
    } else {
      localStorage.removeItem('isAdmin');
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await authService.getCurrentUser();
        if (response?.success) {
          setUser(response.data || null);
          setIsLoggedIn(Boolean(response.data));
        }
        // Load saved accounts list
        const savedRes = await authService.getSavedAccounts();
        if (savedRes?.success) setSavedAccounts(savedRes.data || []);
      } catch (error) {
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

  const handleGoogleAuth = async (token) => {
    try {
      // Do NOT toggle global `loading` here — it unmounts the Login page
      // (including GoogleLogin), causing the GSI client to re-initialize.
      const response = await authService.googleAuth(token);
      if (response?.success) {
        setUser(response.data.user);
        setIsLoggedIn(true);
        return { success: true, data: response.data };
      }
      return { success: false, error: response?.message || 'Google Auth failed' };
    } catch (error) {
      return { success: false, error: error.message || 'Google Auth failed' };
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
      setAdminStatus(false);
    }
  };

  const handleAddAccount = async (email, password) => {
    try {
      const response = await authService.addAccount(email, password);
      if (response?.success) {
        // Refresh the saved accounts list
        const savedRes = await authService.getSavedAccounts();
        if (savedRes?.success) setSavedAccounts(savedRes.data || []);
        return { success: true, data: response.data };
      }
      return { success: false, error: response?.message || 'Failed to add account' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to add account' };
    }
  };

  const handleSwitchAccount = async (targetUserId) => {
    try {
      setLoading(true);
      const response = await authService.switchAccount(targetUserId);
      if (response?.success) {
        // Full reload clears all stale per-user state (liked videos, watch history, etc.)
        window.location.href = '/';
        return { success: true };
      }
      return { success: false, error: response?.message || 'Failed to switch account' };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message || 'Failed to switch account' };
    }
  };

  const handleRemoveAccount = async (accountId) => {
    try {
      const response = await authService.removeAccount(accountId);
      if (response?.success) {
        setSavedAccounts(prev => prev.filter(a => a._id !== accountId));
        return { success: true };
      }
      return { success: false, error: response?.message || 'Failed to remove account' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message || 'Failed to remove account' };
    }
  };

  const updateUser = (userData) => {
    setUser(prev => prev ? { ...prev, ...userData } : userData);
  };

  const adminLogout = () => {
    setAdminStatus(false);
  };

  const value = {
    user,
    isLoggedIn,
    isAuthenticated: isLoggedIn,
    loading,
    savedAccounts,
    isAdmin,
    setAdminStatus,
    login: handleLogin,
    googleLogin: handleGoogleAuth,
    register: handleRegister,
    logout: handleLogout,
    adminLogout,
    addAccount: handleAddAccount,
    switchAccount: handleSwitchAccount,
    removeAccount: handleRemoveAccount,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
