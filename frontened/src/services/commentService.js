import apiClient from './api.js';

// Comment Services
export const commentService = {
  // Get all comments for a video
  async getVideoComments(videoId, page = 1, limit = 10) {
    try {
      const response = await apiClient.get(`/comment/get-video-comment/${videoId}?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Get video comments error:', error);
      return { success: false, data: [] };
    }
  },

  // Add a new comment to a video
  async addComment(videoId, content) {
    try {
      const response = await apiClient.post(`/comment/add-comment/${videoId}`, { content });
      return response;
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  },

  // Update an existing comment
  async updateComment(commentId, content) {
    try {
      const response = await apiClient.patch(`/comment/update-comment/${commentId}`, { content });
      return response;
    } catch (error) {
      console.error('Update comment error:', error);
      throw error;
    }
  },

  // Delete a comment
  async deleteComment(commentId) {
    try {
      const response = await apiClient.delete(`/comment/delete-comment/${commentId}`);
      return response;
    } catch (error) {
      console.error('Delete comment error:', error);
      throw error;
    }
  },
};

// Transform comment data from backend to frontend format
export const transformCommentData = (backendComment) => {
  if (!backendComment) return null;

  return {
    id: backendComment._id,
    _id: backendComment._id, // Keep both for compatibility
    content: backendComment.content,
    user: {
      id: backendComment.userDetails?._id,
      name: backendComment.userDetails?.fullName || backendComment.userDetails?.userName || 'Unknown User',
      userName: backendComment.userDetails?.userName || 'unknown',
      avatar: backendComment.userDetails?.avatar || '',
    },
    createdAt: backendComment.createdAt,
    likesCount: backendComment.likesCount || 0,
    dislikesCount: backendComment.dislikesCount || 0,
    isLikedByUser: backendComment.isLikedByUser || false,
    isDislikedByUser: backendComment.isDislikedByUser || false,
    // Keep old format for compatibility
    isLiked: backendComment.isLikedByUser || backendComment.isLiked || false,
  };
};

// Transform array of comments
export const transformCommentsArray = (backendComments) => {
  if (!Array.isArray(backendComments)) return [];
  return backendComments.map(transformCommentData).filter(Boolean);
};
