import { mongoose } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Subscription } from "../models/subscription.model.js";
import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";

// Helper function to get sender information
const getSenderInfo = async (senderId) => {
    try {
        return await User.findById(senderId).select('userName fullName avatar');
    } catch (error) {
        console.error('Error getting sender info:', error);
        return null;
    }
};

// Helper function to send real-time notification if user is online
const sendRealTimeNotification = (recipient, notification) => {
    if (!global.io) return false;
    
    const userRoom = `user:${recipient}`;
    const clients = global.io.sockets.adapter.rooms.get(userRoom);
    
    // Check if user is online (has active socket connections)
    if (clients && clients.size > 0) {
        const notificationData = {
            _id: notification._id,
            type: notification.type,
            message: notification.message,
            sender: {
                _id: notification.sender._id,
                userName: notification.sender.userName,
                fullName: notification.sender.fullName,
                avatar: notification.sender.avatar
            },
            // Rich content for UI display
            content: {
                video: notification.video ? {
                    _id: notification.video._id,
                    title: notification.video.title,
                    thumbnail: notification.video.thumbnail,
                    duration: notification.video.duration
                } : null,
                tweet: notification.tweet ? {
                    _id: notification.tweet._id,
                    content: notification.tweet.content
                } : null
            },
            createdAt: notification.createdAt,
            isRead: false,
            isDismissed: false
        };

        // Emit to user's personal notification room
        global.io.to(userRoom).emit('new-notification', notificationData);
        return true; // User is online
    }
    
    return false; // User is offline
};

// Helper function to create and send notification
const createAndSendNotification = async ({ recipient, sender, type, message, video = null, tweet = null }) => {
    try {
        // Don't send notification to self
        if (recipient.toString() === sender.toString()) {
            return null;
        }

        // Create notification in database (ALWAYS store for offline users)
        const notification = await Notification.create({
            recipient,
            sender,
            type,
            message,
            video,
            tweet,
            isSent: false // Will be updated if user is online
        });

        // Populate sender and content information for socket emission
        await notification.populate('sender', 'userName fullName avatar');
        
        // Populate video content if exists
        if (notification.video) {
            await notification.populate('video', 'title thumbnail duration views');
        }
        
        // Populate tweet content if exists
        if (notification.tweet) {
            await notification.populate('tweet', 'content');
        }

        // Try to send real-time notification if user is online
        const isUserOnline = sendRealTimeNotification(recipient, notification);
        
        // Update isSent status if successfully sent to online user
        if (isUserOnline) {
            await Notification.findByIdAndUpdate(notification._id, { isSent: true });
            console.log(`✅ Real-time notification sent to user:${recipient}`);
        } else {
            console.log(`💾 Notification stored for offline user:${recipient}`);
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

// Helper function to generate notification messages
const generateMessage = (type, senderName, contentTitle = '') => {
    const messages = {
        'video_upload': `${senderName} uploaded a new video "${contentTitle}"`,
        'tweet_post': `${senderName} posted a new tweet`
    };

    return messages[type] || `${senderName} performed an action`;
};

// Send video upload notification to subscribers
const notifyVideoUpload = async (channelOwnerId, videoTitle, videoId) => {
    try {
        const sender = await getSenderInfo(channelOwnerId);
        if (!sender) return null;

        // Get subscribers who have enabled video notifications
        const subscribers = await Subscription.aggregate([
            {
                $match: { channel: new mongoose.Types.ObjectId(channelOwnerId) }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "subscriberDetails",
                    pipeline: [
                        {
                            $match: { notifyOnVideo: true } // Only users who enabled video notifications
                        },
                        {
                            $project: { _id: 1 }
                        }
                    ]
                }
            },
            {
                $match: { "subscriberDetails.0": { $exists: true } } // Only include if user details exist
            },
            {
                $project: { subscriber: 1 }
            }
        ]);

        const message = generateMessage('video_upload', sender.fullName || sender.userName, videoTitle);
        
        // Send notification to eligible subscribers
        const notifications = [];
        for (const sub of subscribers) {
            const notification = await createAndSendNotification({
                recipient: sub.subscriber,
                sender: channelOwnerId,
                type: 'video_upload',
                message,
                video: videoId
            });
            if (notification) notifications.push(notification);
        }

        return notifications;
    } catch (error) {
        console.error('Error sending video upload notifications:', error);
        return null;
    }
};

// Send tweet post notification to subscribers
const notifyTweetPost = async (authorId, tweetContent, tweetId) => {
    try {
        const sender = await getSenderInfo(authorId);
        if (!sender) return null;

        // Get subscribers who have enabled post notifications
        const subscribers = await Subscription.aggregate([
            {
                $match: { channel: new mongoose.Types.ObjectId(authorId) }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "subscriberDetails",
                    pipeline: [
                        {
                            $match: { notifyOnPost: true } // Only users who enabled post notifications
                        },
                        {
                            $project: { _id: 1 }
                        }
                    ]
                }
            },
            {
                $match: { "subscriberDetails.0": { $exists: true } } // Only include if user details exist
            },
            {
                $project: { subscriber: 1 }
            }
        ]);

        const message = generateMessage('tweet_post', sender.fullName || sender.userName);
        
        // Send notification to eligible subscribers
        const notifications = [];
        for (const sub of subscribers) {
            const notification = await createAndSendNotification({
                recipient: sub.subscriber,
                sender: authorId,
                type: 'tweet_post',
                message,
                tweet: tweetId
            });
            if (notification) notifications.push(notification);
        }

        return notifications;
    } catch (error) {
        console.error('Error sending tweet post notifications:', error);
        return null;
    }
};

// Get user notifications with pagination
const getUserNotifications = asyncHandler(async (req, res) => {
    if (!req?.user) {
        throw new ApiError(401, "User must be logged in");
    }

    const { page = 1, limit = 20 } = req.query;
    
    try {
        const skip = (page - 1) * limit;
        
        // Only get unread notifications since read ones are deleted
        const notifications = await Notification.find({ 
            recipient: req.user._id,
            isRead: false // Only unread notifications exist
        })
            .populate('sender', 'userName fullName avatar')
            .populate('video', 'title thumbnail duration')
            .populate('tweet', 'content')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments({ 
            recipient: req.user._id,
            isRead: false 
        });

        // All notifications are unread since read ones are deleted
        const unreadCount = total;

        const result = {
            notifications,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalNotifications: total,
                unreadCount
            }
        };

        return res
            .status(200)
            .json(
                new ApiResponse(200, result, "Notifications fetched successfully")
            );
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw new ApiError(500, "Failed to fetch notifications");
    }
});

// Dismiss notification (cross button clicked)
const dismissNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    if (!req?.user) {
        throw new ApiError(401, "User must be logged in");
    }

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        throw new ApiError(400, "Invalid notification ID");
    }

    try {
        const userRoom = `user:${req.user._id}`;
        const clients = global.io.sockets.adapter.rooms.get(userRoom);
        
        if (clients && clients.size > 0) {
            // User is online - remove immediately, don't store in DB
            await Notification.findOneAndDelete({
                _id: notificationId,
                recipient: req.user._id
            });
            
            // Send real-time update to remove from UI
            global.io.to(userRoom).emit('notification-dismissed', {
                notificationId: notificationId
            });
            
            console.log(`🗑️ Online dismissal: Notification ${notificationId} deleted immediately`);
            
            return res
                .status(200)
                .json(
                    new ApiResponse(200, { success: true, stored: false }, "Notification dismissed successfully")
                );
        } else {
            // User is offline - mark as dismissed but keep in DB
            const result = await Notification.findOneAndUpdate(
                { _id: notificationId, recipient: req.user._id },
                { isDismissed: true },
                { new: true }
            );
            
            console.log(`💾 Offline dismissal: Notification ${notificationId} marked as dismissed`);
            
            return res
                .status(200)
                .json(
                    new ApiResponse(200, { success: true, stored: true, notification: result }, "Notification dismissed successfully")
                );
        }
    } catch (error) {
        console.error('Error dismissing notification:', error);
        throw new ApiError(500, "Failed to dismiss notification");
    }
});

// Store active notifications when user goes offline
const storeActiveNotifications = asyncHandler(async (req, res) => {
    const { activeNotifications } = req.body;

    if (!req?.user) {
        throw new ApiError(401, "User must be logged in");
    }

    try {
        // Only store notifications that haven't been dismissed
        const notificationsToStore = activeNotifications.filter(notif => !notif.isDismissed);
        
        if (notificationsToStore.length > 0) {
            // Update existing notifications or create new ones
            for (const notif of notificationsToStore) {
                await Notification.findOneAndUpdate(
                    { _id: notif._id },
                    {
                        recipient: req.user._id,
                        sender: notif.sender._id,
                        type: notif.type,
                        message: notif.message,
                        video: notif.content?.video?._id,
                        tweet: notif.content?.tweet?._id,
                        isRead: notif.isRead,
                        isDismissed: false,
                        isSent: true  // Was sent during online session
                    },
                    { upsert: true, new: true }
                );
            }
            
            console.log(`💾 Stored ${notificationsToStore.length} active notifications for offline user ${req.user._id}`);
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, { success: true, storedCount: notificationsToStore.length }, "Active notifications stored successfully")
            );
    } catch (error) {
        console.error('Error storing active notifications:', error);
        throw new ApiError(500, "Failed to store active notifications");
    }
});

// Mark notification as read (which deletes it from database)
const markNotificationAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    if (!req?.user) {
        throw new ApiError(401, "User must be logged in");
    }

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        throw new ApiError(400, "Invalid notification ID");
    }

    try {
        // Find and DELETE the notification when marked as read
        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            recipient: req.user._id
        });

        if (!notification) {
            throw new ApiError(404, "Notification not found");
        }

        console.log(`🗑️ Notification deleted after being read:`, notificationId);
        
        // Send real-time update to user that notification was read/deleted
        if (global.io) {
            global.io.to(`user:${req.user._id}`).emit('notification-deleted', {
                notificationId: notificationId
            });
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, { deleted: true }, "Notification marked as read and deleted")
            );
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw new ApiError(500, "Failed to mark notification as read");
    }
});

// Mark all notifications as read (which deletes them all from database)
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    if (!req?.user) {
        throw new ApiError(401, "User must be logged in");
    }

    try {
        // DELETE all notifications for the user
        const result = await Notification.deleteMany({
            recipient: req.user._id
        });

        console.log(`🗑️ Deleted ${result.deletedCount} notifications for user:`, req.user._id);
        
        // Send real-time update to user that all notifications were deleted
        if (global.io) {
            global.io.to(`user:${req.user._id}`).emit('all-notifications-deleted');
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, { 
                    deletedCount: result.deletedCount 
                }, "All notifications marked as read and deleted")
            );
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw new ApiError(500, "Failed to mark all notifications as read");
    }
});

// Get unread notification count (since read notifications are deleted)
const getUnreadNotificationCount = asyncHandler(async (req, res) => {
    if (!req?.user) {
        throw new ApiError(401, "User must be logged in");
    }

    try {
        // Since read notifications are deleted, all notifications are unread
        const count = await Notification.countDocuments({
            recipient: req.user._id
        });

        console.log(`🔍 DEBUG: User ${req.user._id} has ${count} unread notifications`);

        return res
            .status(200)
            .json(
                new ApiResponse(200, { unreadCount: count }, "Unread count fetched successfully")
            );
    } catch (error) {
        console.error('Error fetching unread count:', error);
        throw new ApiError(500, "Failed to fetch unread count");
    }
});

// Delete a specific notification
const deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    if (!req?.user) {
        throw new ApiError(401, "User must be logged in");
    }

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        throw new ApiError(400, "Invalid notification ID");
    }

    try {
        const result = await Notification.findOneAndDelete({
            _id: notificationId,
            recipient: req.user._id
        });

        if (!result) {
            throw new ApiError(404, "Notification not found");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "Notification deleted successfully")
            );
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw new ApiError(500, "Failed to delete notification");
    }
});

// Legacy functions (keeping for compatibility)
const videoUploadeNotify = asyncHandler(async (req, res) => {
    if (!req?.user) throw new ApiError(404, "User must be logged in");

    const notify = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "noted",
                pipeline: [
                    {
                        $match: {
                            notifyOnVideo: true
                        }
                    }
                ]
            }
        }
    ]);

    return res
        .status(201)
        .json(
            new ApiResponse(201, notify, "fetched successfully")
        );
});

const postUploadNotify = asyncHandler(async (req, res) => {
    if (!req?.user) throw new ApiError(404, "User must be logged in");

    const notify = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "noted",
                pipeline: [
                    {
                        $match: {
                            notifyOnPost: true
                        }
                    }
                ]
            }
        }
    ]);

    return res
        .status(201)
        .json(
            new ApiResponse(201, notify, "fetched successfully")
        );
});

export {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadNotificationCount,
    deleteNotification,
    dismissNotification,
    storeActiveNotifications,
    videoUploadeNotify,
    postUploadNotify,
    notifyVideoUpload,
    notifyTweetPost
};