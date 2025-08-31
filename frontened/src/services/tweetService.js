import apiClient from './api.js';

// Tweet Services
export const tweetService = {
  // Create a new tweet
  async createTweet(content) {
    try {
      const response = await apiClient.post('/tweets/create-tweet', { content });
      return response;
    } catch (error) {
      console.error('Create tweet error:', error);
      throw error;
    }
  },

  // Get current user's tweets
  async getUserTweets(page = 1, limit = 10) {
    try {
      const response = await apiClient.get(`/tweets/get-tweet?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Get user tweets error:', error);
      return { success: false, data: [] };
    }
  },

  // Update a tweet
  async updateTweet(tweetId, content) {
    try {
      const response = await apiClient.patch(`/tweets/update-tweet/${tweetId}`, { content });
      return response;
    } catch (error) {
      console.error('Update tweet error:', error);
      throw error;
    }
  },

  // Delete a tweet
  async deleteTweet(tweetId) {
    try {
      const response = await apiClient.delete(`/tweets/remove-tweet/${tweetId}`);
      return response;
    } catch (error) {
      console.error('Delete tweet error:', error);
      throw error;
    }
  },

  // Toggle tweet like
  async toggleTweetLike(tweetId) {
    try {
      const response = await apiClient.get(`/likes/toggle-tweet-like/${tweetId}`);
      return response;
    } catch (error) {
      console.error('Toggle tweet like error:', error);
      throw error;
    }
  }
};

// Helper to transform tweet data from backend format
export const transformTweetData = (backendTweet) => {
  if (!backendTweet) return null;
  
  return {
    id: backendTweet._id,
    content: backendTweet.content,
    owner: {
      id: backendTweet.owner?._id || backendTweet.owner?.id,
      userName: backendTweet.owner?.userName,
      fullName: backendTweet.owner?.fullName,
      avatar: backendTweet.owner?.avatar
    },
    likesCount: backendTweet.likesCount || 0,
    isLikedByUser: backendTweet.isLikedByUser || false,
    createdAt: backendTweet.createdAt,
    updatedAt: backendTweet.updatedAt
  };
};

// Helper to transform array of tweets
export const transformTweetsArray = (backendTweets) => {
  if (!Array.isArray(backendTweets)) return [];
  return backendTweets.map(transformTweetData).filter(Boolean);
};

