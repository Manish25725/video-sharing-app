import apiClient from './api.js';

// Comment Services
export const commentService = {
  // Get all comments for a video
  async getVideoComments(videoId, page = 1, limit = 10) {
    try {
      const response = await apiClient.get(`/comment/get-video-comments-enhanced/${videoId}?page=${page}&limit=${limit}`);
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
      // Return error details for better debugging
      if (error.isAuthError) {
        throw new Error('Please log in to add comments');
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to add comment. Please try again.');
      }
    }
  },

  // Add a reply to a comment
  async addReply(commentId, content) {
    try {
      const response = await apiClient.post(`/comment/add-reply/${commentId}`, { content });
      return response;
    } catch (error) {
      console.error('Add reply error:', error);
      throw error;
    }
  },

  // Add a reply to a reply (nested reply)
  async addReplyToReply(replyId, content) {
    try {
      const response = await apiClient.post(`/comment/add-reply-to-reply/${replyId}`, { content });
      return response;
    } catch (error) {
      console.error('Add nested reply error:', error);
      throw error;
    }
  },

  // Get replies for a specific comment
  async getCommentReplies(commentId, page = 1, limit = 5) {
    try {
      const response = await apiClient.get(`/comment/get-replies/${commentId}?page=${page}&limit=${limit}`);
      // Ensure consistent response format
      if (response && response.data) {
        return { success: true, data: { replies: response.data } };
      } else {
        console.warn('Invalid response format from getCommentReplies:', response);
        return { success: false, data: { replies: [] } };
      }
    } catch (error) {
      console.error('Get replies error:', error);
      return { success: false, data: { replies: [] } };
    }
  },

  // Get nested replies for a specific reply
  async getReplyReplies(replyId, page = 1, limit = 5) {
    try {
      const response = await apiClient.get(`/comment/get-reply-replies/${replyId}?page=${page}&limit=${limit}`);
      if (response && response.data) {
        return { success: true, data: { replies: response.data } };
      } else {
        console.warn('Invalid response format from getReplyReplies:', response);
        return { success: false, data: { replies: [] } };
      }
    } catch (error) {
      console.error('Get nested replies error:', error);
      return { success: false, data: { replies: [] } };
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

  // Handle both userDetails (from aggregation) and owner (from populate)
  const userInfo = backendComment.userDetails || backendComment.owner || {};

  return {
    id: backendComment._id,
    _id: backendComment._id, // Keep both for compatibility
    content: backendComment.content,
    user: {
      id: userInfo._id,
      name: userInfo.fullName || userInfo.userName || 'Unknown User',
      userName: userInfo.userName || 'unknown',
      avatar: userInfo.avatar || '',
    },
    createdAt: backendComment.createdAt,
    likesCount: backendComment.likesCount || 0,
    dislikesCount: backendComment.dislikesCount || 0,
    isLikedByUser: backendComment.isLikedByUser || false,
    isDislikedByUser: backendComment.isDislikedByUser || false,
    // Keep old format for compatibility
    isLiked: backendComment.isLikedByUser || backendComment.isLiked || false,
    // Reply-related fields
    isReply: backendComment.isReply || false,
    parentComment: backendComment.parentComment || null,
    repliesCount: backendComment.totalReplies || backendComment.repliesCount || 0,
    replies: backendComment.replies ? transformCommentsArray(backendComment.replies) : [],
  };
};

// Transform array of comments
export const transformCommentsArray = (backendComments) => {
  if (!Array.isArray(backendComments)) return [];
  return backendComments.map(transformCommentData).filter(Boolean);
};
