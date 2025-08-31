import apiClient from './api.js';

// Subscription Services
export const subscriptionService = {
  // Check if user is subscribed to a channel
  async isSubscribedToChannel(channelId) {
    try {
      console.log('Checking subscription for channel:', channelId);
      const response = await apiClient.get(`/subscription/check-subscription/${channelId}`);
      console.log('Subscription check response:', response);
      
      return response.data?.isSubscribed || false;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  },

  // Toggle subscription to a channel
  async toggleSubscription(channelId) {
    try {
      console.log('Toggling subscription for channel:', channelId);
      const response = await apiClient.post(`/subscription/toggle-subscribe/${channelId}`);
      console.log('Toggle subscription response:', response);
      
      return response;
    } catch (error) {
      console.error('Error toggling subscription:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Get subscriber count for a channel
  async getSubscriberCount(channelId) {
    try {
      const response = await apiClient.post(`/subscription/get-user-channel-subscriber/${channelId}`);
      return { success: true, count: response.data?.length || 0 };
    } catch (error) {
      console.error('Error getting subscriber count:', error);
      return { success: false, count: 0 };
    }
  },

  // Get subscribers of a channel
  async getChannelSubscribers(channelId) {
    try {
      const response = await apiClient.post(`/subscription/get-user-channel-subscriber/${channelId}`);
      return response;
    } catch (error) {
      console.error('Get channel subscribers error:', error);
      return { success: false, data: [] };
    }
  },

  // Get channels that user is subscribed to
  async getSubscribedChannels(subscriberId) {
    try {
      const response = await apiClient.get(`/subscription/get-channel/${subscriberId}`);
      return response;
    } catch (error) {
      console.error('Get subscribed channels error:', error);
      return { success: false, data: [] };
    }
  },
};

// Transform subscription data
export const transformSubscriptionData = (backendSubscription) => {
  if (!backendSubscription) return null;

  return {
    id: backendSubscription._id,
    subscriberId: backendSubscription.subscriber,
    channelId: backendSubscription.channel,
    subscribedAt: backendSubscription.createdAt,
  };
};

// Transform channel data for subscriptions
export const transformChannelData = (backendChannel) => {
  if (!backendChannel) return null;

  return {
    id: backendChannel._id,
    name: backendChannel.fullName || backendChannel.userName,
    userName: backendChannel.userName,
    avatar: backendChannel.avatar,
    coverImage: backendChannel.coverImage,
    subscribersCount: backendChannel.subscribersCount || 0,
    isSubscribed: backendChannel.isSubscribed || false,
  };
};
