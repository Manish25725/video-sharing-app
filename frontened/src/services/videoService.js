import apiClient from './api.js';
import { formatDuration } from '../utils/formatters.js';

// Video Services
export const videoService = {
  // Get all videos with pagination
  async getAllVideos(page = 1, limit = 10, query = '', sortBy = 'createdAt', sortType = 'desc', userId = '', videoType = '') {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        query,
        sortBy,
        sortType,
      });
      
      if (userId) {
        queryParams.append('userId', userId);
      }

      if (videoType) {
        queryParams.append('videoType', videoType);
      }
      
      const response = await apiClient.get(`/videos/get-all-videos?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Get all videos error:', error);
      return { success: false, data: [] };
    }
  },

  // Get video by ID
  async getVideoById(videoId) {
    try {
      const response = await apiClient.get(`/videos/getvideo/${videoId}`);
      return response;
    } catch (error) {
      console.error('Get video by ID error:', error);
      return null;
    }
  },

  // Toggle publish status
  async togglePublishStatus(videoId, isPublished = true) {
    try {
      const response = await apiClient.patch(`/videos/toggle-status/${videoId}?isPublished=${isPublished}`);
      return response;
    } catch (error) {
      console.error('Toggle publish status error:', error);
      throw error;
    }
  },

  // Publish new video with progress tracking
  async publishVideoWithProgress(videoData, videoFile, thumbnailFile, onProgress) {
    try {
      const formData = new FormData();
      formData.append('title', videoData.title);
      formData.append('description', videoData.description);
      
      if (videoData.videoType) {
        formData.append('videoType', videoData.videoType);
      }
      
      if (videoFile) {
        formData.append('video', videoFile);
      }
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      const response = await apiClient.post('/videos/publish-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      });
      return response;
    } catch (error) {
      console.error('Publish video error:', error);
      throw error;
    }
  },

  // Publish new video
  async publishVideo(videoData, videoFile, thumbnailFile) {
    try {
      const formData = new FormData();
      formData.append('title', videoData.title);
      formData.append('description', videoData.description);
      
      if (videoData.videoType) {
        formData.append('videoType', videoData.videoType);
      }
      
      if (videoFile) {
        formData.append('video', videoFile);
      }
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      const response = await apiClient.post('/videos/publish-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response;
    } catch (error) {
      console.error('Publish video error:', error);
      throw error;
    }
  },

  // Update video details
  async updateVideo(videoId, updateData, thumbnailFile = null) {
    try {
      const formData = new FormData();
      
      if (updateData.title) formData.append('title', updateData.title);
      if (updateData.description) formData.append('description', updateData.description);
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile);

      const response = await apiClient.patch(`/videos/update-video-details/${videoId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response;
    } catch (error) {
      console.error('Update video error:', error);
      throw error;
    }
  },

  // Delete video
  async deleteVideo(videoId) {
    try {
      const response = await apiClient.delete(`/videos/delete-video/${videoId}`);
      return response;
    } catch (error) {
      console.error('Delete video error:', error);
      throw error;
    }
  },

  // Search videos
  async searchVideos(query, page = 1, limit = 20) {
    // Use the existing getAllVideos endpoint with query parameter
    return await this.getAllVideos(page, limit, query);
  },

  // Increment video views
  async incrementViews(videoId) {
    try {
      const response = await apiClient.patch(`/videos/increment-views/${videoId}`);
      return response;
    } catch (error) {
      console.error("Error incrementing views:", error);
      return { success: false };
    }
  },

  // Get video stats (views, likes, user's like status)
  async getVideoStats(videoId) {
    try {
      const response = await apiClient.get(`/videos/video-stats/${videoId}`);
      return response;
    } catch (error) {
      console.error("Error fetching video stats:", error);
      return { success: false };
    }
  },

  async getTrendingVideos(videoType = '') {
    try {
      const queryParams = videoType ? `?videoType=${encodeURIComponent(videoType)}` : '';
      const response = await apiClient.get(`/videos/get-trending-videos${queryParams}`);
      return response;
    } catch (error) {
      console.log("get trending video error", error);
      return { success: false, data: [] };
    }
  }
};

// Transform backend video data to frontend format
export const transformVideoData = (backendVideo) => {
  if (!backendVideo) return null;

  console.log('transformVideoData input:', {
    _id: backendVideo._id,
    title: backendVideo.title,
    createdAt: backendVideo.createdAt,
    uploadDate: backendVideo.uploadDate,
    createdAtType: typeof backendVideo.createdAt
  });


  // Use createdAt as the primary date source, fallback to uploadDate
  let uploadTime = backendVideo.createdAt || backendVideo.uploadDate;
  
  // Don't set a fallback date - let the frontend handle it
  if (!uploadTime) {
    uploadTime = null;
  }

  const result = {
    id: backendVideo._id,
    title: backendVideo.title,
    thumbnail: backendVideo.thumbnail,
    duration: formatDuration(backendVideo.duration),
    views: backendVideo.views,
    channelName: backendVideo.owner?.fullName || backendVideo.owner?.userName || 'Unknown',
    channelAvatar: backendVideo.owner?.avatar,
    uploadTime: uploadTime, // This will be used by formatTimeAgo in VideoCard
    uploadDate: uploadTime, // Keep for backward compatibility
    videoFile: backendVideo.videoFile,
    description: backendVideo.description,
    owner: backendVideo.owner,
    isPublished: backendVideo.isPublished,
  };

  console.log('transformVideoData output:', {
    id: result.id,
    title: result.title,
    uploadTime: result.uploadTime,
    uploadTimeType: typeof result.uploadTime
  });

  return result;
};

// Transform multiple videos
export const transformVideosArray = (backendVideos) => {
  if (!Array.isArray(backendVideos)) return [];
  return backendVideos.map(transformVideoData).filter(Boolean);
};


