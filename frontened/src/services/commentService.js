import apiClient from './api.js';

// Comment Services
export const commentService = {
  // Get all comments for a video
  async getVideoComments(videoId, page = 1, limit = 10) {
    const response = await apiClient.makeRequest(`/comment/get-video-comment/${videoId}?page=${page}&limit=${limit}`);
    if (response.ok) {
      return await response.json();
    }
    return { data: [] };
  },

  // Add a new comment to a video
  async addComment(videoId, content) {
    const response = await apiClient.makeRequest(`/comment/add-comment/${videoId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return await response.json();
  },

  // Update an existing comment
  async updateComment(commentId, content) {
    const response = await apiClient.makeRequest(`/comment/update-comment/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
    return await response.json();
  },

  // Delete a comment
  async deleteComment(commentId) {
    const response = await apiClient.makeRequest(`/comment/delete-comment/${commentId}`, {
      method: 'DELETE',
    });
    return await response.json();
  },
};

// Transform comment data from backend to frontend format
export const transformCommentData = (backendComment) => {
  if (!backendComment) return null;

  return {
    id: backendComment._id,
    content: backendComment.content,
    user: {
      id: backendComment.userDetails?._id,
      name: backendComment.userDetails?.fullName || backendComment.userDetails?.userName || 'Unknown User',
      userName: backendComment.userDetails?.userName || 'unknown',
      avatar: backendComment.userDetails?.avatar || '',
    },
    createdAt: backendComment.createdAt,
    likesCount: backendComment.likesCount || 0,
    isLiked: backendComment.isLiked || false,
  };
};

// Transform array of comments
export const transformCommentsArray = (backendComments) => {
  if (!Array.isArray(backendComments)) return [];
  return backendComments.map(transformCommentData).filter(Boolean);
};
