import apiClient from './api.js';

// User Authentication Services
export const authService = {
  // Register new user
  async register(userData, avatarFile, coverImageFile) {
    try {
      const formData = new FormData();
      formData.append('fullName', userData.fullName);
      formData.append('email', userData.email);
      formData.append('userName', userData.userName);
      formData.append('password', userData.password);
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      if (coverImageFile) {
        formData.append('coverImage', coverImageFile);
      }

      const response = await apiClient.post('/users/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  // Login user
  async login(email, password) {
    try {
      const response = await apiClient.post('/users/login', { email, password });
      // Backend handles everything via cookies - no need to store anything
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout user
  async logout() {
    try {
      await apiClient.post('/users/logout');
      // Backend clears cookies automatically - no need to clear anything locally
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const response = await apiClient.get('/users/current-user');
      return response;
    } catch (error) {
      return null;
    }
  },

  // Get user channel profile
  async getUserChannelProfile(userName) {
    try {
      const response = await apiClient.get(`/users/c/${userName}`);
      return response;
    } catch (error) {
      console.error('Get user channel profile error:', error);
      return null;
    }
  },
  
  // Get user profile by ID or username
  async getUserProfile(userId) {
    try {
      // First check if we're looking for the current user
      const currentUser = getCurrentUserFromStorage();
      if (currentUser && currentUser._id === userId) {
        // If requesting current user, use the current-user endpoint for freshest data
        const response = await apiClient.get('/users/current-user');
        if (response.success) {
          return { success: true, data: response.data };
        }
      }
      
      // Try with channel endpoint (using user ID or username)
      const channelResponse = await apiClient.get(`/users/c/${userId}`);
      if (channelResponse.success) {
        return { success: true, data: channelResponse.data };
      }
      
      // If we're here, the user wasn't found with direct ID approach
      // Let's check if there's a current user and if the requested profile is for that user
      if (currentUser) {
        if (currentUser._id === userId || currentUser.userName === userId) {
          return { success: true, data: currentUser };
        }
      }
      
      // As a last resort, return an error
      return { success: false, message: "User profile not found" };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return { success: false, message: "Failed to fetch user profile", error: error.message };
    }
  },

  // Update user details
  async updateUserDetails(userData) {
    try {
      const response = await apiClient.patch('/users/update-account', userData);
      return response;
    } catch (error) {
      console.error('Update user details error:', error);
      throw error;
    }
  },

  // Update avatar
  async updateAvatar(avatarFile) {
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await apiClient.patch('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response;
    } catch (error) {
      console.error('Update avatar error:', error);
      throw error;
    }
  },

  // Get watch history
  async getWatchHistory() {
    try {
      const response = await apiClient.get('/users/history');
      return response;
    } catch (error) {
      console.error('Get watch history error:', error);
      return { success: false, data: [] };
    }
  },

  // Change password
  async changePassword(oldPassword, newPassword) {
    try {
      const response = await apiClient.post('/users/change-password', { 
        oldPassword, 
        newPassword 
      });
      return response;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },
};

// Check if user is logged in by calling the API
export const isAuthenticated = async () => {
  try {
    const response = await apiClient.get('/users/current-user');
    return response && response.success;
  } catch (error) {
    return false;
  }
};

// Get current user from API
export const getCurrentUserFromStorage = async () => {
  try {
    const response = await apiClient.get('/users/current-user');
    return response && response.success ? response.data : null;
  } catch (error) {
    return null;
  }
};
