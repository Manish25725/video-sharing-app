import React, { useState, useEffect, useRef } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid, XMarkIcon, PlayIcon } from '@heroicons/react/24/solid';
import { MessageCircle, Radio, CalendarDays } from 'lucide-react';
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

    const handleDropdownOpen = () => {
        setShowDropdown(true);
        if (notifications.length === 0) {
            fetchRecentNotifications();
        }
    };

    const handleDropdownClose = () => {
        setShowDropdown(false);
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

    const getNotificationMeta = (notification) => {
        switch (notification.type) {
            case 'video_upload':
                return {
                    border: 'border-[#ec5b13]',
                    dot: '#ec5b13',
                    iconBg: 'bg-[#ec5b13]',
                    previewBg: 'rgba(236,91,19,0.08)',
                    textAccent: '#fdba74',
                    label: 'New video',
                };
            case 'tweet_post':
                return {
                    border: 'border-sky-500/60',
                    dot: '#38bdf8',
                    iconBg: 'bg-sky-500',
                    previewBg: 'rgba(56,189,248,0.08)',
                    textAccent: '#7dd3fc',
                    label: 'New post',
                };
            case 'stream_scheduled':
                return {
                    border: 'border-rose-500/70',
                    dot: '#f43f5e',
                    iconBg: 'bg-rose-500',
                    previewBg: 'rgba(244,63,94,0.08)',
                    textAccent: '#fda4af',
                    label: 'Live event',
                };
            default:
                return {
                    border: 'border-white/10',
                    dot: '#ec5b13',
                    iconBg: 'bg-[#ec5b13]',
                    previewBg: 'rgba(255,255,255,0.04)',
                    textAccent: '#fdba74',
                    label: 'Update',
                };
        }
    };

    const getNotificationTarget = (notification) => {
        if (notification.content?.video?._id) return `/video/${notification.content.video._id}`;
        if (notification.type === 'stream_scheduled' || notification.content?.scheduledStream?._id) return '/scheduled-streams';
        if (notification.content?.tweet?._id) return '/tweets';
        return null;
    };

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    if (!user) return null;

    return (
        <div
            className="relative"
            onMouseEnter={handleDropdownOpen}
            onMouseLeave={handleDropdownClose}
        >
            <button
                onClick={handleDropdownOpen}
                className="relative p-2 rounded-xl transition-colors focus:outline-none"
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    color: unreadCount > 0 ? '#ec5b13' : '#cbd5e1',
                    border: '1px solid rgba(236,91,19,0.08)'
                }}
                title={`${unreadCount} notifications`}
            >
                {unreadCount > 0 ? (
                    <BellIconSolid className="h-6 w-6" />
                ) : (
                    <BellIcon className="h-6 w-6" />
                )}
                
                {unreadCount > 0 && (
                    <>
                        <span className="absolute top-2 right-2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ec5b13] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ec5b13]"></span>
                        </span>
                        <span className="absolute -top-2 -right-2 bg-[#ec5b13] text-white text-[10px] rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center font-bold shadow-lg shadow-[#ec5b13]/30">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    </>
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-3 z-50 w-[min(24rem,calc(100vw-1.5rem))] max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="overflow-hidden rounded-2xl shadow-2xl" style={{ background: 'rgba(15,15,15,0.88)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 18px 60px rgba(120,53,15,0.35)' }}>
                    <div className="px-6 py-5 border-b border-white/5">
                        <div className="flex justify-between items-center gap-4">
                            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                Notifications
                                <span className="bg-[#ec5b13] text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-black">Premium</span>
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs font-semibold transition-colors flex items-center gap-1"
                                    style={{ color: '#ec5b13' }}
                                >
                                    <span className="text-sm">✓</span>
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center text-sm" style={{ color: '#94a3b8' }}>Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-6 text-center text-sm" style={{ color: '#94a3b8' }}>No notifications yet</div>
                        ) : (
                            notifications.map((notification) => {
                                const meta = getNotificationMeta(notification);
                                const targetPath = getNotificationTarget(notification);
                                const Wrapper = targetPath ? Link : 'div';

                                return (
                                    <div key={notification._id} className={`px-6 py-4 flex gap-4 hover:bg-white/5 transition-colors relative group border-l-4 ${notification.isRead ? 'border-transparent opacity-75' : meta.border}`}>
                                        <Wrapper
                                            {...(targetPath ? { to: targetPath } : {})}
                                            className="flex gap-4 flex-1 min-w-0"
                                            onClick={() => {
                                                handleMarkAsRead(notification._id);
                                                setShowDropdown(false);
                                            }}
                                        >
                                            <div className="relative shrink-0">
                                                {notification.sender?.avatar ? (
                                                    <img
                                                        src={notification.sender.avatar}
                                                        alt={notification.sender.fullName || notification.sender.userName}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: 'rgba(236,91,19,0.2)' }}>
                                                        {(notification.sender?.fullName || notification.sender?.userName || 'U')[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <div className={`absolute -bottom-1 -right-1 ${meta.iconBg} rounded-full p-1 flex items-center justify-center shadow-lg`}>
                                                    {notification.type === 'video_upload' && <PlayIcon className="w-3 h-3 text-white" />}
                                                    {notification.type === 'tweet_post' && <MessageCircle className="w-3 h-3 text-white" />}
                                                    {notification.type === 'stream_scheduled' && <Radio className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0 space-y-1">
                                                <p className="text-sm font-medium leading-tight text-slate-300">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-2 text-[11px]">
                                                    <span className="px-2 py-0.5 rounded-full uppercase tracking-widest font-bold" style={{ background: meta.previewBg, color: meta.textAccent }}>
                                                        {meta.label}
                                                    </span>
                                                    <span style={{ color: '#94a3b8' }}>{formatTimeAgo(notification.createdAt)}</span>
                                                </div>

                                                {notification.content?.video && (
                                                    <div className="flex items-center gap-3 p-2 rounded-xl mt-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                        <div className="relative shrink-0">
                                                            <img
                                                                src={notification.content.video.thumbnail}
                                                                alt={notification.content.video.title}
                                                                className="w-16 h-12 object-cover rounded-lg"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <PlayIcon className="w-4 h-4 text-white bg-black/60 rounded-full p-1" />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium text-slate-100 truncate">
                                                                {notification.content.video.title}
                                                            </p>
                                                            <p className="text-[11px] text-slate-500">
                                                                {notification.content.video.duration && `${Math.floor(notification.content.video.duration / 60)}:${(notification.content.video.duration % 60).toString().padStart(2, '0')}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {notification.content?.tweet && (
                                                    <div className="p-3 rounded-xl mt-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                        <p className="text-xs italic text-slate-300 leading-relaxed">
                                                            "{notification.content.tweet.content.substring(0, 100)}{notification.content.tweet.content.length > 100 ? '...' : ''}"
                                                        </p>
                                                    </div>
                                                )}

                                                {(notification.type === 'stream_scheduled' || notification.content?.scheduledStream) && (
                                                    <div className="flex items-center gap-3 p-2 rounded-xl mt-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(244,63,94,0.14)' }}>
                                                            <CalendarDays className="w-4 h-4" style={{ color: '#fda4af' }} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-slate-100 truncate">
                                                                {notification.content?.scheduledStream?.title || 'Upcoming stream'}
                                                            </p>
                                                            {notification.content?.scheduledStream?.scheduledAt && (
                                                                <p className="text-[11px]" style={{ color: '#94a3b8' }}>
                                                                    {new Date(notification.content.scheduledStream.scheduledAt).toLocaleString(undefined, {
                                                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                                    })}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Wrapper>

                                        <div className="shrink-0 flex items-start gap-2">
                                            {!notification.isRead && (
                                                <div className="w-2 h-2 rounded-full mt-2" style={{ background: meta.dot }}></div>
                                            )}
                                            <button
                                                onClick={(e) => handleDismissNotification(notification._id, e)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-white/10"
                                                title="Dismiss notification"
                                            >
                                                <XMarkIcon className="w-4 h-4 text-slate-400" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-4 text-center border-t border-white/5 bg-white/5">
                            <button
                                onClick={() => {
                                    setShowDropdown(false);
                                }}
                                className="w-full py-2 text-sm font-bold transition-colors"
                                style={{ color: '#cbd5e1' }}
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;