import apiClient from './api.js';

// Playlist Services
export const playlistService = {
  // Create a new playlist
  async createPlaylist(playlistData) {
    try {
      const response = await apiClient.post('/playlist/create-playlist', playlistData);
      return response;
    } catch (error) {
      console.error('Create playlist error:', error);
      throw error;
    }
  },

  // Get current user's playlists
  async getUserPlaylists(userId = null) {
    try {
      let endpoint = '/playlist/get-user-playlists';
      if (userId) {
        endpoint = `/playlist/get-user-playlists/${userId}`;
      }
      const response = await apiClient.get(endpoint);
      console.log('Raw playlist service response:', response); // Debug log
      return response;
    } catch (error) {
      console.error('Get user playlists error:', error);
      return { success: false, data: [] };
    }
  },

  // Get current user's creator playlists (for channel management)
  async getCreatorPlaylists(userId = null) {
    try {
      let endpoint = '/playlist/get-creator-playlists';
      if (userId) {
        endpoint = `/playlist/get-creator-playlists/${userId}`;
      }
      const response = await apiClient.get(endpoint);
      console.log('Raw creator playlist service response:', response); // Debug log
      return response;
    } catch (error) {
      console.error('Get creator playlists error:', error);
      return { success: false, data: [] };
    }
  },

  // Get a specific playlist
  async getPlaylistById(playlistId) {
    try {
      const response = await apiClient.get(`/playlist/get-playlist/${playlistId}`);
      return response;
    } catch (error) {
      console.error('Get playlist by ID error:', error);
      return null;
    }
  },

  // Add video to playlist
  async addVideoToPlaylist(playlistId, videoId) {
    try {
      console.log('Adding video to playlist:', { playlistId, videoId }); // Debug log
      if (!playlistId || playlistId === 'undefined') {
        throw new Error('Invalid playlist ID');
      }
      if (!videoId || videoId === 'undefined') {
        throw new Error('Invalid video ID');
      }
      const response = await apiClient.post(`/playlist/add-video-to-playlist/${playlistId}/${videoId}`);
      return response;
    } catch (error) {
      console.error('Add video to playlist error:', error);
      throw error;
    }
  },

  // Remove video from playlist
  async removeVideoFromPlaylist(playlistId, videoId) {
    try {
      console.log('Removing video from playlist:', { playlistId, videoId }); // Debug log
      if (!playlistId || playlistId === 'undefined') {
        throw new Error('Invalid playlist ID');
      }
      if (!videoId || videoId === 'undefined') {
        throw new Error('Invalid video ID');
      }
      const response = await apiClient.get(`/playlist/remove-video-playlist/${playlistId}/${videoId}`);
      return response;
    } catch (error) {
      console.error('Remove video from playlist error:', error);
      throw error;
    }
  },

  // Delete playlist
  async deletePlaylist(playlistId) {
    try {
      const response = await apiClient.delete(`/playlist/delete-playlist/${playlistId}`);
      return response;
    } catch (error) {
      console.error('Delete playlist error:', error);
      throw error;
    }
  },

  // Update playlist details
  async updatePlaylist(playlistId, updateData) {
    try {
      const response = await apiClient.patch(`/playlist/update-playlist/${playlistId}`, updateData);
      return response;
    } catch (error) {
      console.error('Update playlist error:', error);
      throw error;
    }
  },

  // Add video to queue (temporary playlist)
  async addToQueue(videoId) {
    try {
      const queue = JSON.parse(localStorage.getItem('videoQueue') || '[]');
      if (!queue.includes(videoId)) {
        queue.push(videoId);
        localStorage.setItem('videoQueue', JSON.stringify(queue));
      }
      return { success: true, message: 'Added to queue' };
    } catch (error) {
      console.error('Error adding to queue:', error);
      return { success: false, message: 'Failed to add to queue' };
    }
  },

  // Add to Watch Later
  async addToWatchLater(videoId) {
    try {
      const response = await apiClient.post('/playlist/add-to-watch-later', { videoId });
      
      if (response.success) {
        return { success: true, message: 'Added to Watch Later', data: response.data };
      } else {
        // Fallback to localStorage if API not available
        const watchLater = JSON.parse(localStorage.getItem('watchLater') || '[]');
        if (!watchLater.includes(videoId)) {
          watchLater.push(videoId);
          localStorage.setItem('watchLater', JSON.stringify(watchLater));
        }
        return { success: true, message: 'Added to Watch Later' };
      }
    } catch (error) {
      console.error('Error adding to watch later:', error);
      // Fallback to localStorage
      const watchLater = JSON.parse(localStorage.getItem('watchLater') || '[]');
      if (!watchLater.includes(videoId)) {
        watchLater.push(videoId);
        localStorage.setItem('watchLater', JSON.stringify(watchLater));
      }
      return { success: true, message: 'Added to Watch Later' };
    }
  },

  // Mark video as not interested
  async markNotInterested(videoId) {
    try {
      const notInterested = JSON.parse(localStorage.getItem('notInterestedVideos') || '[]');
      if (!notInterested.includes(videoId)) {
        notInterested.push(videoId);
        localStorage.setItem('notInterestedVideos', JSON.stringify(notInterested));
      }
      return { success: true, message: 'Marked as not interested' };
    } catch (error) {
      console.error('Error marking as not interested:', error);
      return { success: false, message: 'Failed to mark as not interested' };
    }
  },

  // Don't recommend channel
  async dontRecommendChannel(channelId) {
    try {
      const blockedChannels = JSON.parse(localStorage.getItem('blockedChannels') || '[]');
      if (!blockedChannels.includes(channelId)) {
        blockedChannels.push(channelId);
        localStorage.setItem('blockedChannels', JSON.stringify(blockedChannels));
      }
      return { success: true, message: 'Channel blocked from recommendations' };
    } catch (error) {
      console.error('Error blocking channel:', error);
      return { success: false, message: 'Failed to block channel' };
    }
  },

  // Report video
  async reportVideo(videoId, reason) {
    try {
      const response = await apiClient.post('/report/video', { videoId, reason });
      
      if (response.success) {
        return { success: true, message: 'Video reported successfully' };
      }
      return { success: false, message: 'Failed to report video' };
    } catch (error) {
      console.error('Error reporting video:', error);
      return { success: false, message: 'Failed to report video' };
    }
  }
};

// Helper to transform playlist data
export const transformPlaylistData = (backendPlaylist) => {
  if (!backendPlaylist) return null;

  return {
    id: backendPlaylist._id,
    name: backendPlaylist.name,
    description: backendPlaylist.description,
    owner: backendPlaylist.owner,
    videos: backendPlaylist.videos || [],
    createdAt: backendPlaylist.createdAt,
    updatedAt: backendPlaylist.updatedAt,
  };
};

// Helper to transform array of playlists
export const transformPlaylistsArray = (backendPlaylists) => {
  if (!Array.isArray(backendPlaylists)) return [];
  return backendPlaylists.map(transformPlaylistData).filter(Boolean);
};

// Share functionality
export const shareService = {
  async shareVideo(videoId, title) {
    try {
      const url = `${window.location.origin}/video/${videoId}`;
      
      if (navigator.share) {
        // Use native sharing if available
        await navigator.share({
          title: title,
          url: url
        });
        return { success: true, message: 'Shared successfully' };
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(url);
        return { success: true, message: 'Link copied to clipboard' };
      }
    } catch (error) {
      console.error('Error sharing video:', error);
      return { success: false, message: 'Failed to share video' };
    }
  }
};
