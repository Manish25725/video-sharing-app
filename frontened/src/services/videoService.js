import apiClient from './api.js';
import { formatDuration } from '../utils/formatters.js';

// Video Services
export const videoService = {
  // Get all videos with pagination
  async getAllVideos(page = 1, limit = 10, query = '', sortBy = 'createdAt', sortType = 'desc', userId = '') {
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
    
    const response = await apiClient.makeRequest(`/videos/get-all-videos?${queryParams.toString()}`);

    if (response.ok) {
      return await response.json();
    }
    return { data: [] };
  },

  // Get video by ID
  async getVideoById(videoId) {
    const response = await apiClient.makeRequest(`/videos/getvideo/${videoId}`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  },

  // Toggle publish status
  async togglePublishStatus(videoId, isPublished = true) {
    const response = await apiClient.makeRequest(`/videos/toggle-status/${videoId}?isPublished=${isPublished}`, {
      method: 'PATCH',
    });
    return await response.json();
  },

  // Publish new video
  async publishVideo(videoData, videoFile, thumbnailFile) {
    const formData = new FormData();
    formData.append('title', videoData.title);
    formData.append('description', videoData.description);
    
    if (videoFile) {
      formData.append('video', videoFile);
    }
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }

    const response = await apiClient.makeFormDataRequest('/videos/publish-video', formData);
    return await response.json();
  },

  // Update video details
  async updateVideo(videoId, updateData, thumbnailFile = null) {
    const formData = new FormData();
    
    if (updateData.title) formData.append('title', updateData.title);
    if (updateData.description) formData.append('description', updateData.description);
    if (thumbnailFile) formData.append('thumbnail', thumbnailFile);

    const response = await apiClient.makeFormDataRequest(`/videos/update-video-details/${videoId}`, formData, {
      method: 'PATCH',
    });
    return await response.json();
  },

  // Delete video
  async deleteVideo(videoId) {
    const response = await apiClient.makeRequest(`/videos/delete-video/${videoId}`, {
      method: 'DELETE',
    });
    return await response.json();
  },

  // Search videos
  async searchVideos(query, page = 1, limit = 20) {
    // Use the existing getAllVideos endpoint with query parameter
    return await this.getAllVideos(page, limit, query);
  },

  // Increment video views
  async incrementViews(videoId) {
    try {
      const response = await apiClient.makeRequest(`/videos/increment-views/${videoId}`, {
        method: 'PATCH',
      });
      return await response.json();
    } catch (error) {
      console.error("Error incrementing views:", error);
      return { success: false };
    }
  },

  // Get video stats (views, likes, user's like status)
  async getVideoStats(videoId) {
    try {
      const response = await apiClient.makeRequest(`/videos/video-stats/${videoId}`);
      if (response.ok) {
        return await response.json();
      }
      return { success: false };
    } catch (error) {
      console.error("Error fetching video stats:", error);
      return { success: false };
    }
  },
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
