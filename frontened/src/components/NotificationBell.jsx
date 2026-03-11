import React, { useState, useEffect, useRef } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid, XMarkIcon, PlayIcon } from '@heroicons/react/24/solid';
import { Radio } from 'lucide-react';
import notificationService from '../services/notificationService';
import socketService from '../services/socketService';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const NotificationBell = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const { user } = useAuth();
    const dropdownRef = useRef(null);

    // Use a ref so the offline handler always has the latest notifications
    // without being listed as a useEffect dependency
    const notificationsRef = useRef(notifications);
    useEffect(() => { notificationsRef.current = notifications; }, [notifications]);

    useEffect(() => {
        if (user) {
            fetchUnreadCount();
            
            // Connect to socket and listen for real-time notifications
            socketService.connect(user._id);
            socketService.onNotification(handleNewNotification);
            
            // Listen for notification events
            socketService.on('notification-dismissed', handleNotificationDismissed);
            socketService.on('notification-deleted', handleNotificationDeleted);
            socketService.on('all-notifications-deleted', handleAllNotificationsDeleted);

            // Handle online/offline events
            const handleOnline = () => {
                setIsOnline(true);
            };

            const handleOffline = async () => {
                setIsOnline(false);
                
                // Store active notifications before going offline
                if (notificationsRef.current.length > 0) {
                    try {
                        await notificationService.storeActiveNotifications(notificationsRef.current);
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
                socketService.off('notification-deleted', handleNotificationDeleted);
                socketService.off('all-notifications-deleted', handleAllNotificationsDeleted);
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }
    }, [user]);

    const handleNewNotification = (notification) => {
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
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleNotificationDeleted = ({ notificationId }) => {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleAllNotificationsDeleted = () => {
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
            setUnreadCount(response.unreadCount ?? 0);
        } catch (error) {
            console.error('Error fetching unread count:', error);
            setUnreadCount(0);
        }
    };

    const fetchRecentNotifications = async () => {
        if (loading) return;
        
        setLoading(true);
        try {
            const response = await notificationService.getNotifications(1, 5);
            setNotifications(response.notifications ?? []);
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
        // Optimistically remove from UI immediately
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        try {
            await notificationService.markAsRead(notificationId);
            // Socket event 'notification-deleted' will be a no-op since already removed
        } catch (error) {
            console.error('Error marking notification as read:', error);
            // Refetch to restore correct state on failure
            fetchUnreadCount();
            fetchRecentNotifications();
        }
    };

    const handleMarkAllAsRead = async () => {
        // Optimistically clear UI immediately
        setNotifications([]);
        setUnreadCount(0);
        try {
            await notificationService.markAllAsRead();
            // Socket event 'all-notifications-deleted' will be a no-op since already cleared
        } catch (error) {
            console.error('Error marking all as read:', error);
            // Refetch to restore correct state on failure
            fetchUnreadCount();
            fetchRecentNotifications();
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
                title={`${unreadCount} notifications`}
            >
                {unreadCount > 0 ? (
                    <BellIconSolid className="h-6 w-6 text-blue-600" />
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
                                    className="relative group"
                                >
                                    <div className="p-4 border-b border-gray-100 hover:bg-gray-50 bg-blue-50">
                                        <div className="flex items-start space-x-3">
                                            {/* Sender Avatar */}
                                            {notification.sender?.avatar ? (
                                                <img
                                                    src={notification.sender.avatar}
                                                    alt={notification.sender.fullName || notification.sender.userName}
                                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm text-gray-600 font-medium">
                                                        {(notification.sender?.fullName || notification.sender?.userName || 'U')[0].toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            <div className="flex-1 min-w-0">
                                                {/* Notification Message */}
                                                <p className="text-sm text-gray-900 font-medium mb-2">
                                                    {notification.message}
                                                </p>
                                                
                                                {/* Rich Content */}
                                                {notification.content?.video && (
                                                    <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg mb-2">
                                                        <div className="relative">
                                                            <img
                                                                src={notification.content.video.thumbnail}
                                                                alt={notification.content.video.title}
                                                                className="w-16 h-12 object-cover rounded"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <PlayIcon className="w-4 h-4 text-white bg-black bg-opacity-50 rounded-full p-1" />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium text-gray-900 truncate">
                                                                {notification.content.video.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {notification.content.video.duration && `${Math.floor(notification.content.video.duration / 60)}:${(notification.content.video.duration % 60).toString().padStart(2, '0')}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {notification.content?.tweet && (
                                                    <div className="p-2 bg-gray-50 rounded-lg mb-2">
                                                        <p className="text-xs text-gray-700 italic">
                                                            "{notification.content.tweet.content.substring(0, 100)}{notification.content.tweet.content.length > 100 ? '...' : ''}"
                                                        </p>
                                                    </div>
                                                )}

                                                {(notification.type === 'stream_scheduled' || notification.content?.scheduledStream) && (
                                                    <Link to="/scheduled-streams"
                                                        className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg mb-2 hover:bg-indigo-100 transition-colors"
                                                        onClick={() => setShowDropdown(false)}
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                                            <Radio className="w-4 h-4 text-indigo-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-indigo-800 truncate">
                                                                {notification.content?.scheduledStream?.title || 'Upcoming stream'}
                                                            </p>
                                                            {notification.content?.scheduledStream?.scheduledAt && (
                                                                <p className="text-xs text-indigo-500">
                                                                    {new Date(notification.content.scheduledStream.scheduledAt).toLocaleString(undefined, {
                                                                        month: 'short', day: 'numeric',
                                                                        hour: '2-digit', minute: '2-digit'
                                                                    })}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </Link>
                                                )}
                                                
                                                {/* Timestamp */}
                                                <p className="text-xs text-gray-500">
                                                    {formatTimeAgo(notification.createdAt)}
                                                </p>
                                            </div>
                                            
                                            {/* Cross Button */}
                                            <button
                                                onClick={(e) => handleDismissNotification(notification._id, e)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded-full"
                                                title="Dismiss notification"
                                            >
                                                <XMarkIcon className="w-4 h-4 text-gray-500" />
                                            </button>
                                        </div>
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