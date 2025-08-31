import apiClient from './api.js';

// User Authentication Services
export const authService = {
  // Register new user
  async register(userData, avatarFile, coverImageFile) {
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

    const response = await apiClient.makeFormDataRequest('/users/register', formData);
    return await response.json();
  },

  // Login user
  async login(email, password) {
    const response = await apiClient.makeRequest('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      // Store tokens
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      return data;
    }
    
    throw new Error('Login failed');
  },

  // Logout user
  async logout() {
    try {
      await apiClient.makeRequest('/users/logout', {
        method: 'POST',
      });
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  },

  // Get current user
  async getCurrentUser() {
    const response = await apiClient.makeRequest('/users/current-user');
    if (response.ok) {
      return await response.json();
    }
    return null;
  },

  // Get user channel profile
  async getUserChannelProfile(userName) {
    const response = await apiClient.makeRequest(`/users/c/${userName}`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  },
  
  // Get user profile by ID or username
  async getUserProfile(userId) {
    try {
      // First check if we're looking for the current user
      const currentUser = getCurrentUserFromStorage();
      if (currentUser && currentUser._id === userId) {
        // If requesting current user, use the current-user endpoint for freshest data
        const response = await apiClient.makeRequest('/users/current-user');
        if (response.ok) {
          const data = await response.json();
          return { success: true, data: data.data };
        }
      }
      
      // Try to get user by ID or username from the backend
      // Since we don't have a direct getUserById endpoint, we'll need to use the channel endpoint
      
      // Try with channel endpoint (using user ID or username)
      const channelResponse = await apiClient.makeRequest(`/users/c/${userId}`);
      if (channelResponse.ok) {
        const data = await channelResponse.json();
        return { success: true, data: data.data };
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
    const response = await apiClient.makeRequest('/users/update-account', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
    return await response.json();
  },

  // Update avatar
  async updateAvatar(avatarFile) {
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    const response = await apiClient.makeFormDataRequest('/users/avatar', formData, {
      method: 'PATCH',
    });
    return await response.json();
  },

  // Get watch history
  async getWatchHistory() {
    const response = await apiClient.makeRequest('/users/history');
    if (response.ok) {
      return await response.json();
    }
    return { data: [] };
  },

  // Change password
  async changePassword(oldPassword, newPassword) {
    const response = await apiClient.makeRequest('/users/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    return await response.json();
  },
};

// Check if user is logged in
export const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken');
};

// Get current user from localStorage
export const getCurrentUserFromStorage = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};
