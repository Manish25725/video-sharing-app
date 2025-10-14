import React, { useState, useEffect, useRef } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid, XMarkIcon, PlayIcon } from '@heroicons/react/24/solid';
import notificationService from '../services/notificationService';
import socketService from '../services/socketService';
import { useAuth } from '../contexts/AuthContext';

const NotificationBell = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const { user } = useAuth();
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchUnreadCount();
            
            // Connect to socket and listen for real-time notifications
            socketService.connect(user._id);
            socketService.onNotification(handleNewNotification);
            
            // Listen for notification events
            socketService.on('notification-dismissed', handleNotificationDismissed);
            socketService.on('all-notifications-deleted', handleAllNotificationsDeleted);

            // Handle online/offline events
            const handleOnline = () => {
                setIsOnline(true);
                console.log('📶 User came online');
            };

            const handleOffline = async () => {
                setIsOnline(false);
                console.log('📴 User went offline');
                
                // Store active notifications before going offline
                if (notifications.length > 0) {
                    try {
                        await notificationService.storeActiveNotifications(notifications);
                        console.log('💾 Stored active notifications for offline');
                    } catch (error) {
                        console.error('Error storing notifications:', error);
                    }
                }
            };

            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            return () => {
                socketService.offNotification(handleNewNotification);
                socketService.off('notification-dismissed', handleNotificationDismissed);
                socketService.off('all-notifications-deleted', handleAllNotificationsDeleted);
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }
    }, [user, notifications]);

    const handleNewNotification = (notification) => {
        console.log('New notification received:', notification);
        setUnreadCount(prev => prev + 1);
        setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only 5 latest
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
            new Notification(notification.message, {
                icon: '/favicon.ico',
                badge: '/favicon.ico'
            });
        }
    };

    const handleNotificationDismissed = ({ notificationId }) => {
        console.log('Notification dismissed:', notificationId);
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleAllNotificationsDeleted = () => {
        console.log('All notifications deleted');
        setNotifications([]);
        setUnreadCount(0);
    };

    const handleDismissNotification = async (notificationId, event) => {
        event.stopPropagation(); // Prevent notification click
        
        try {
            await notificationService.dismissNotification(notificationId);
            console.log('Notification dismissed successfully:', notificationId);
            
            // If offline, remove from UI immediately
            if (!isOnline) {
                setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error dismissing notification:', error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await notificationService.getUnreadCount();
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const fetchRecentNotifications = async () => {
        if (loading) return;
        
        setLoading(true);
        try {
            const response = await notificationService.getNotifications(1, 5);
            setNotifications(response.data.notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBellClick = () => {
        setShowDropdown(!showDropdown);
        if (!showDropdown && notifications.length === 0) {
            fetchRecentNotifications();
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationService.markAsRead(notificationId);
            // Notification is automatically removed from UI via socket event
            console.log('Notification marked as read and deleted:', notificationId);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            // All notifications are automatically removed from UI via socket event
            console.log('All notifications marked as read and deleted');
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const formatTimeAgo = (date) => {
        const now = new Date();
        const notificationDate = new Date(date);
        const diffInSeconds = Math.floor((now - notificationDate) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    if (!user) return null;

    return (
        <div className="relative">
            <button
                onClick={handleBellClick}
                className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
            >
                {unreadCount > 0 ? (
                    <BellIconSolid className="h-6 w-6" />
                ) : (
                    <BellIcon className="h-6 w-6" />
                )}
                
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">No notifications yet</div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer bg-blue-50`}
                                    onClick={() => handleMarkAsRead(notification._id)}
                                >
                                    <div className="flex items-start space-x-3">
                                        {notification.sender?.avatar ? (
                                            <img
                                                src={notification.sender.avatar}
                                                alt={notification.sender.fullName || notification.sender.userName}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                <span className="text-xs text-gray-600">
                                                    {(notification.sender?.fullName || notification.sender?.userName || 'U')[0].toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900">{notification.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatTimeAgo(notification.createdAt)}
                                            </p>
                                        </div>
                                        
                                        {/* All notifications show unread indicator since read ones are deleted */}
                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-4 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setShowDropdown(false);
                                    // Navigate to notifications page if you have one
                                    // navigate('/notifications');
                                }}
                                className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Click outside to close */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                ></div>
            )}
        </div>
    );
};

export default NotificationBell;