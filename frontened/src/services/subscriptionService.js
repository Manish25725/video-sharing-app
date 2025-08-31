import apiClient from './api.js';

// Subscription Services
export const subscriptionService = {
  // Check if user is subscribed to a channel
  async isSubscribedToChannel(channelId) {
    try {
      console.log('Checking subscription for channel:', channelId);
      const response = await apiClient.makeRequest(`/subscription/check-subscription/${channelId}`);
      console.log('Subscription check response:', response);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Subscription check data:', data);
        return data.data?.isSubscribed || false;
      } else {
        console.log('Subscription check failed, response not ok:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  },

  // Toggle subscription to a channel
  async toggleSubscription(channelId) {
    try {
      console.log('Toggling subscription for channel:', channelId);
      const response = await apiClient.makeRequest(`/subscription/toggle-subscribe/${channelId}`, {
        method: 'POST'
      });
      console.log('Toggle subscription response:', response);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Toggle subscription result:', result);
        return result;
      }
      console.log('Toggle subscription failed, response not ok:', response.status);
      return { success: false, message: 'Failed to toggle subscription' };
    } catch (error) {
      console.error('Error toggling subscription:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Get subscriber count for a channel
  async getSubscriberCount(channelId) {
    try {
      const response = await apiClient.makeRequest(`/subscription/get-user-channel-subscriber/${channelId}`, {
        method: 'POST'
      });
      if (response.ok) {
        const result = await response.json();
        return { success: true, count: result.data?.length || 0 };
      }
      return { success: false, count: 0 };
    } catch (error) {
      console.error('Error getting subscriber count:', error);
      return { success: false, count: 0 };
    }
  },

  // Get subscribers of a channel
  async getChannelSubscribers(channelId) {
    const response = await apiClient.makeRequest(`/subscription/get-user-channel-subscriber/${channelId}`, {
      method: 'POST'
    });
    if (response.ok) {
      return await response.json();
    }
    return { data: [] };
  },

  // Get channels that user is subscribed to
  async getSubscribedChannels(subscriberId) {
    const response = await apiClient.makeRequest(`/subscription/get-channel/${subscriberId}`);
    if (response.ok) {
      return await response.json();
    }
    return { data: [] };
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
