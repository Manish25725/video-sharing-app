import apiClient from './api.js';

// Tweet Services
export const tweetService = {
  async createTweet(formData) {
    try {
      const response = await apiClient.uploadFile('/tweets/create-tweet', formData);
      return response;
    } catch (error) {
      console.error('Create tweet error:', error);
      throw error;
    }
  },

  async getUserTweets(page = 1, limit = 10) {
    try {
      const response = await apiClient.get(`/tweets/get-tweet?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Get user tweets error:', error);
      return { success: false, data: [] };
    }
  },

  async getTweetsByUser(userId, page = 1, limit = 10) {
    try {
      const response = await apiClient.get(`/tweets/get-tweets/${userId}?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Get tweets by user error:', error);
      return { success: false, data: [] };
    }
  },

  async updateTweet(tweetId, content) {
    try {
      const response = await apiClient.patch(`/tweets/update-tweet/${tweetId}`, { content });
      return response;
    } catch (error) {
      console.error('Update tweet error:', error);
      throw error;
    }
  },

  async deleteTweet(tweetId) {
    try {
      const response = await apiClient.delete(`/tweets/remove-tweet/${tweetId}`);
      return response;
    } catch (error) {
      console.error('Delete tweet error:', error);
      throw error;
    }
  },

  async toggleComments(tweetId) {
    try {
      const response = await apiClient.patch(`/tweets/toggle-comments/${tweetId}`);
      return response;
    } catch (error) {
      console.error('Toggle comments error:', error);
      throw error;
    }
  },

  async votePoll(tweetId, optionIndex) {
    try {
      const response = await apiClient.post(`/tweets/vote-poll/${tweetId}`, { optionIndex });
      return response;
    } catch (error) {
      console.error('Vote poll error:', error);
      throw error;
    }
  },

  async getTweetComments(tweetId, page = 1, limit = 10) {
    try {
      const response = await apiClient.get(`/comment/get-tweet-comment/${tweetId}?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Get tweet comments error:', error);
      return { success: false, data: [] };
    }
  },

  async addComment(tweetId, content) {
    try {
      const response = await apiClient.post(`/comment/add-comment-tweet/${tweetId}`, { content });
      return response;
    } catch (error) {
      console.error('Add tweet comment error:', error);
      throw error;
    }
  },

  async deleteComment(commentId) {
    try {
      const response = await apiClient.delete(`/comment/delete-comment/${commentId}`);
      return response;
    } catch (error) {
      console.error('Delete tweet comment error:', error);
      throw error;
    }
  },
};

export const transformTweetData = (backendTweet) => {
  if (!backendTweet) return null;
  return {
    id: backendTweet._id,
    content: backendTweet.content,
    images: backendTweet.images || [],
    poll: backendTweet.poll || null,
    commentsEnabled: backendTweet.commentsEnabled !== false,
    owner: {
      id: backendTweet.ownerDetails?._id || backendTweet.owner,
      userName: backendTweet.ownerDetails?.userName,
      fullName: backendTweet.ownerDetails?.fullName,
      avatar: backendTweet.ownerDetails?.avatar,
    },
    likesCount: backendTweet.likesCount || 0,
    commentsCount: backendTweet.commentsCount || 0,
    isLikedByUser: backendTweet.isLikedByUser || false,
    createdAt: backendTweet.createdAt,
    updatedAt: backendTweet.updatedAt,
  };
};

export const transformTweetsArray = (arr) =>
  Array.isArray(arr) ? arr.map(transformTweetData).filter(Boolean) : [];
