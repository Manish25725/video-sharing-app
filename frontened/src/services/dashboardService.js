import apiClient from './api.js';

// Dashboard Services
export const dashboardService = {
  // Get channel statistics
  async getChannelStats() {
    try {
      const response = await apiClient.get('/dashboard/access-channel-details');
      return response;
    } catch (error) {
      console.error('Get channel stats error:', error);
      return { success: false, data: { totalViews: 0, totalVideos: 0, totalSubscribers: 0, totalLikes: 0 } };
    }
  },

  // Get channel videos
  async getChannelVideos() {
    try {
      const response = await apiClient.get('/dashboard/get-channel-videos');
      return response;
    } catch (error) {
      console.error('Get channel videos error:', error);
      return { success: false, data: [] };
    }
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
