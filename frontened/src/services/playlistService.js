import apiClient from './api.js';

// Playlist Services
export const playlistService = {
  // Create a new playlist
  async createPlaylist(name, description = '') {
    const response = await apiClient.makeRequest('/playlist', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    return await response.json();
  },

  // Get user playlists
  async getUserPlaylists(userId) {
    const response = await apiClient.makeRequest(`/playlist/${userId}`);
    if (response.ok) {
      return await response.json();
    }
    return { data: [] };
  },

  // Get a specific playlist
  async getPlaylistById(playlistId) {
    const response = await apiClient.makeRequest(`/playlist/get/${playlistId}`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  },

  // Add video to playlist
  async addVideoToPlaylist(playlistId, videoId) {
    const response = await apiClient.makeRequest(`/playlist/add/${playlistId}/${videoId}`, {
      method: 'POST',
    });
    return await response.json();
  },

  // Remove video from playlist
  async removeVideoFromPlaylist(playlistId, videoId) {
    const response = await apiClient.makeRequest(`/playlist/remove/${playlistId}/${videoId}`, {
      method: 'DELETE',
    });
    return await response.json();
  },

  // Delete playlist
  async deletePlaylist(playlistId) {
    const response = await apiClient.makeRequest(`/playlist/${playlistId}`, {
      method: 'DELETE',
    });
    return await response.json();
  },

  // Update playlist details
  async updatePlaylist(playlistId, name, description) {
    const response = await apiClient.makeRequest(`/playlist/${playlistId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, description }),
    });
    return await response.json();
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
      const response = await apiClient.makeRequest('/playlist/add-to-watch-later', {
        method: 'POST',
        body: JSON.stringify({ videoId })
      });
      
      if (response.ok) {
        const result = await response.json();
        return { success: true, message: 'Added to Watch Later', data: result.data };
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
      const response = await apiClient.makeRequest('/report/video', {
        method: 'POST',
        body: JSON.stringify({ videoId, reason })
      });
      
      if (response.ok) {
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
