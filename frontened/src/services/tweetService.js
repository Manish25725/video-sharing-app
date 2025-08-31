import apiClient from './api.js';

// Tweet Services
export const tweetService = {
  // Create a new tweet
  async createTweet(content) {
    const response = await apiClient.makeRequest('/tweet/create-tweet', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return await response.json();
  },

  // Get current user's tweets
  async getUserTweets(page = 1, limit = 10) {
    const response = await apiClient.makeRequest(`/tweet/get-tweet?page=${page}&limit=${limit}`);
    if (response.ok) {
      return await response.json();
    }
    return { data: [] };
  },

  // Update a tweet
  async updateTweet(tweetId, content) {
    const response = await apiClient.makeRequest(`/tweet/update-tweet/${tweetId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
    return await response.json();
  },

  // Delete a tweet
  async deleteTweet(tweetId) {
    const response = await apiClient.makeRequest(`/tweet/remove-tweet/${tweetId}`, {
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
    createdAt: backendTweet.createdAt,
    updatedAt: backendTweet.updatedAt,
  };
};

// Helper to transform array of tweets
export const transformTweetsArray = (backendTweets) => {
  if (!Array.isArray(backendTweets)) return [];
  return backendTweets.map(transformTweetData).filter(Boolean);
};
