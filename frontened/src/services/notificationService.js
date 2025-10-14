import api from './api.js';

const notificationService = {
    // Get all notifications for the current user
    getNotifications: async (page = 1, limit = 20) => {
        try {
            const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },

    // Get unread notification count
    getUnreadCount: async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            return response.data;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            throw error;
        }
    },

    // Mark notification as read
    markAsRead: async (notificationId) => {
        try {
            const response = await api.patch(`/notifications/${notificationId}/read`);
            return response.data;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    // Mark all notifications as read
    markAllAsRead: async () => {
        try {
            const response = await api.patch('/notifications/read-all');
            return response.data;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    },

    // Delete notification
    deleteNotification: async (notificationId) => {
        try {
            const response = await api.delete(`/notifications/${notificationId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    },

    // Dismiss notification (cross button)
    dismissNotification: async (notificationId) => {
        try {
            const response = await api.patch(`/notifications/${notificationId}/dismiss`);
            return response.data;
        } catch (error) {
            console.error('Error dismissing notification:', error);
            throw error;
        }
    },

    // Store active notifications when going offline
    storeActiveNotifications: async (activeNotifications) => {
        try {
            const response = await api.post('/notifications/store-active', {
                activeNotifications
            });
            return response.data;
        } catch (error) {
            console.error('Error storing active notifications:', error);
            throw error;
        }
    }
};

export default notificationService;