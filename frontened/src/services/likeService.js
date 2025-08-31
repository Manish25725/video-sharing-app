import apiClient from './api.js';

// Like Services
export const likeService = {
  // Toggle like on a video
  async toggleVideoLike(videoId) {
    try {
      const response = await apiClient.get(`/like/toggle-video-like/${videoId}`);
      return response;
    } catch (error) {
      console.error('Toggle video like error:', error);
      return null;
    }
  },

  // Toggle like on a comment
  async toggleCommentLike(commentId) {
    try {
      const response = await apiClient.get(`/like/toggle-comment-like/${commentId}`);
      return response;
    } catch (error) {
      console.error('Toggle comment like error:', error);
      return null;
    }
  },

  // Toggle like on a tweet
  async toggleTweetLike(tweetId) {
    try {
      const response = await apiClient.get(`/like/toggle-tweet-like/${tweetId}`);
      return response;
    } catch (error) {
      console.error('Toggle tweet like error:', error);
      return null;
    }
  },

  // Get all videos liked by the user
  async getLikedVideos() {
    try {
      const response = await apiClient.get('/like/get-liked-videos');
      return response;
    } catch (error) {
      console.error('Get liked videos error:', error);
      return { success: false, data: [] };
    }
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
