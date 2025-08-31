import apiClient from './api.js';

// Like Services
export const likeService = {
  // Toggle like on a video
  async toggleVideoLike(videoId) {
    const response = await apiClient.makeRequest(`/like/toggle-video-like/${videoId}`, {
      method: 'GET',
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  },

  // Toggle like on a comment
  async toggleCommentLike(commentId) {
    const response = await apiClient.makeRequest(`/like/toggle-comment-like/${commentId}`, {
      method: 'GET',
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  },

  // Toggle like on a tweet
  async toggleTweetLike(tweetId) {
    const response = await apiClient.makeRequest(`/like/toggle-tweet-like/${tweetId}`, {
      method: 'GET',
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  },

  // Get all videos liked by the user
  async getLikedVideos() {
    const response = await apiClient.makeRequest('/like/get-liked-videos');
    if (response.ok) {
      return await response.json();
    }
    return { data: [] };
  },
};

// Helper to transform like data
export const transformLikeData = (backendLike) => {
  if (!backendLike) return null;

  return {
    id: backendLike._id,
    videoId: backendLike.video,
    commentId: backendLike.comment,
    tweetId: backendLike.tweet,
    userId: backendLike.likedBy,
    createdAt: backendLike.createdAt,
    videoDetails: backendLike.videoDetails,
  };
};

// Helper to transform array of likes
export const transformLikesArray = (backendLikes) => {
  if (!Array.isArray(backendLikes)) return [];
  return backendLikes.map(transformLikeData).filter(Boolean);
};
