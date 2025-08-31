import apiClient from './api.js';

// Dashboard Services
export const dashboardService = {
  // Get channel statistics
  async getChannelStats() {
    const response = await apiClient.makeRequest('/dashboard/access-channel-details');
    if (response.ok) {
      return await response.json();
    }
    return { data: { totalViews: 0, totalVideos: 0, totalSubscribers: 0, totalLikes: 0 } };
  },

  // Get channel videos
  async getChannelVideos() {
    const response = await apiClient.makeRequest('/dashboard/get-channel-videos');
    if (response.ok) {
      return await response.json();
    }
    return { data: [] };
  },
};

// Helper to transform dashboard stats
export const transformDashboardStats = (backendStats) => {
  if (!backendStats) return null;

  return {
    totalViews: backendStats.totalViews || 0,
    totalVideos: backendStats.totalVideos || 0,
    totalSubscribers: backendStats.totalSubscribers || 0,
    totalLikes: backendStats.totalLikes || 0,
  };
};
