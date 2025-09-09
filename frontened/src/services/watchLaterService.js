import api from './api';

const watchLaterService = {
  // Get all watch later videos
  getWatchLaterVideos: async () => {
    try {
      const response = await api.get('/users/watch-later');
      console.log('Watch later service full response:', response);
      console.log('Watch later service response.data:', response.data);
      // Response structure: { statuscode, data, message, success }
      // We want to return response.data which contains the videos array
      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error fetching watch later videos:', error);
      throw error;
    }
  },

  // Get just the video IDs in watch later list (for state checking)
  getWatchLaterIds: async () => {
    try {
      const response = await api.get('/users/watch-later-ids');
      console.log('Watch later IDs service full response:', response);
      console.log('Watch later IDs service response.data:', response.data);
      return {
        success: response.success || true,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error fetching watch later IDs:', error);
      throw error;
    }
  },

  // Add video to watch later
  addToWatchLater: async (videoId) => {
    try {
      console.log('Adding video to watch later:', videoId);
      const response = await api.post(`/users/watch-later/${videoId}`);
      console.log('Add to watch later response:', response);
      return response;
    } catch (error) {
      console.error('Error adding video to watch later:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  // Remove video from watch later
  removeFromWatchLater: async (videoId) => {
    try {
      console.log('Removing video from watch later:', videoId);
      const response = await api.delete(`/users/watch-later/${videoId}`);
      console.log('Remove from watch later response:', response);
      return response;
    } catch (error) {
      console.error('Error removing video from watch later:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  // Check if video is in watch later list
  isVideoInWatchLater: async (videoId, watchLaterList) => {
    if (!watchLaterList) {
      const watchLaterData = await watchLaterService.getWatchLaterVideos();
      watchLaterList = watchLaterData.data || [];
    }
    return watchLaterList.some(video => video._id === videoId);
  }
};

export default watchLaterService;
