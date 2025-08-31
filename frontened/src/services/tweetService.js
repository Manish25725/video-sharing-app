import apiClient from './api.js';

// Tweet Services
export const tweetService = {
  // Create a new tweet
  async createTweet(content) {
    const response = await apiClient.makeRequest('/tweet', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return await response.json();
  },

  // Get tweets by user ID
  async getUserTweets(userId) {
    const response = await apiClient.makeRequest(`/tweet/${userId}`);
    if (response.ok) {
      return await response.json();
    }
    return { data: [] };
  },

  // Update a tweet
  async updateTweet(tweetId, content) {
    const response = await apiClient.makeRequest(`/tweet/${tweetId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
    return await response.json();
  },

  // Delete a tweet
  async deleteTweet(tweetId) {
    const response = await apiClient.makeRequest(`/tweet/${tweetId}`, {
      method: 'DELETE',
    });
    return await response.json();
  },
};

// Helper to transform tweet data
export const transformTweetData = (backendTweet) => {
  if (!backendTweet) return null;

  return {
    id: backendTweet._id,
    content: backendTweet.content,
    user: {
      id: backendTweet.owner?._id,
      name: backendTweet.owner?.fullName || backendTweet.owner?.userName || 'Unknown User',
      userName: backendTweet.owner?.userName || 'unknown',
      avatar: backendTweet.owner?.avatar || '',
    },
    createdAt: backendTweet.createdAt,
    likesCount: backendTweet.likesCount || 0,
    isLiked: backendTweet.isLiked || false,
  };
};

// Helper to transform array of tweets
export const transformTweetsArray = (backendTweets) => {
  if (!Array.isArray(backendTweets)) return [];
  return backendTweets.map(transformTweetData).filter(Boolean);
};
