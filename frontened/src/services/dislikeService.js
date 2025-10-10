import apiClient from './api.js';

// Dislike Services
export const dislikeService = {
  // Toggle dislike on a video
  async toggleVideoDislike(videoId) {
    try {
      const response = await apiClient.get(`/dislike/toggle-video-dislike/${videoId}`);
      return response;
    } catch (error) {
      console.error('Toggle video dislike error:', error);
      return null;
    }
  },

  // Toggle dislike on a comment
  async toggleCommentDislike(commentId) {
    try {
      const response = await apiClient.get(`/dislike/toggle-comment-dislike/${commentId}`);
      return response;
    } catch (error) {
      console.error('Toggle comment dislike error:', error);
      return null;
    }
  },

  // Toggle dislike on a tweet
  async toggleTweetDislike(tweetId) {
    try {
      const response = await apiClient.get(`/dislike/toggle-tweet-dislike/${tweetId}`);
      return response;
    } catch (error) {
      console.error('Toggle tweet dislike error:', error);
      return null;
    }
  },
};

// Helper to transform dislike data
export const transformDislikeData = (backendDislike) => {
  if (!backendDislike) return null;

  return {
    id: backendDislike._id,
    videoId: backendDislike.video,
    commentId: backendDislike.comment,
    tweetId: backendDislike.tweet,
    userId: backendDislike.dislikedBy,
    createdAt: backendDislike.createdAt,
  };
};

// Helper to transform array of dislikes
export const transformDislikesArray = (backendDislikes) => {
  if (!Array.isArray(backendDislikes)) return [];
  return backendDislikes.map(transformDislikeData).filter(Boolean);
};