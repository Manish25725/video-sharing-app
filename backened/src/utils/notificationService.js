import { Notification } from "../models/notification.model.js";
import mongoose from "mongoose";

// Notification Service for handling real-time notifications
export class NotificationService {
    
    // Create and send a notification
    static async createAndSendNotification({
        recipient,
        sender,
        type,
        message,
        video = null,
        comment = null,
        tweet = null
    }) {
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
                comment,
                tweet,
                isSent: false // Will be updated if user is online
            });

            // Populate sender information for socket emission
            await notification.populate('sender', 'userName fullName avatar');

            // Try to send real-time notification if user is online
            const isUserOnline = this.sendRealTimeNotification(recipient, notification);
            
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
    }

    // Send real-time notification if user is online
    static sendRealTimeNotification(recipient, notification) {
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
                video: notification.video,
                comment: notification.comment,
                tweet: notification.tweet,
                createdAt: notification.createdAt,
                isRead: false
            };

            // Emit to user's personal notification room
            global.io.to(userRoom).emit('new-notification', notificationData);
            return true; // User is online
        }
        
        return false; // User is offline
    }

    // Generate notification messages based on type
    static generateMessage(type, senderName, contentTitle = '') {
        const messages = {
            'video_upload': `${senderName} uploaded a new video "${contentTitle}"`,
            'tweet_post': `${senderName} posted a new tweet`
        };

        return messages[type] || `${senderName} performed an action`;
    }

    // Send new video upload notification to subscribers who have enabled video notifications
    static async notifyVideoUpload(channelOwnerId, videoTitle, videoId) {
        try {
            const sender = await this.getSenderInfo(channelOwnerId);
            if (!sender) return null;

            // Get subscribers who have enabled video notifications
            const { Subscription } = await import("../models/subscription.model.js");
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

            const message = this.generateMessage('video_upload', sender.fullName || sender.userName, videoTitle);
            
            // Send notification to eligible subscribers
            const notifications = [];
            for (const sub of subscribers) {
                const notification = await this.createAndSendNotification({
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
    }

    // Send new tweet notification to subscribers who have enabled post notifications
    static async notifyTweetPost(authorId, tweetContent, tweetId) {
        try {
            const sender = await this.getSenderInfo(authorId);
            if (!sender) return null;

            // Get subscribers who have enabled post notifications
            const { Subscription } = await import("../models/subscription.model.js");
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

            const message = this.generateMessage('tweet_post', sender.fullName || sender.userName);
            
            // Send notification to eligible subscribers
            const notifications = [];
            for (const sub of subscribers) {
                const notification = await this.createAndSendNotification({
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
    }

    // Helper method to get sender information
    static async getSenderInfo(senderId) {
        try {
            const { User } = await import("../models/user.model.js");
            return await User.findById(senderId).select('userName fullName avatar');
        } catch (error) {
            console.error('Error getting sender info:', error);
            return null;
        }
    }

    // Mark notification as read and DELETE from database
    static async markAsRead(notificationId, userId) {
        try {
            // Find and DELETE the notification when marked as read
            const notification = await Notification.findOneAndDelete({
                _id: notificationId,
                recipient: userId
            });

            if (notification) {
                console.log(`🗑️ Notification deleted after being read:`, notificationId);
                
                // Send real-time update to user that notification was read/deleted
                if (global.io) {
                    global.io.to(`user:${userId}`).emit('notification-deleted', {
                        notificationId: notificationId
                    });
                }
                
                return { success: true, deleted: true };
            }

            return null;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return null;
        }
    }

    // Mark all notifications as read and DELETE them from database
    static async markAllAsRead(userId) {
        try {
            // DELETE all notifications for the user
            const result = await Notification.deleteMany({
                recipient: userId
            });

            console.log(`🗑️ Deleted ${result.deletedCount} notifications for user:`, userId);
            
            // Send real-time update to user that all notifications were deleted
            if (global.io) {
                global.io.to(`user:${userId}`).emit('all-notifications-deleted');
            }

            return {
                success: true,
                deletedCount: result.deletedCount
            };
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return null;
        }
    }

    // Get user notifications (only unread since read ones are deleted)
    static async getUserNotifications(userId, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            
            // Only get unread notifications since read ones are deleted
            const notifications = await Notification.find({ 
                recipient: userId,
                isRead: false // Only unread notifications exist
            })
                .populate('sender', 'userName fullName avatar')
                .populate('video', 'title thumbnail')
                .populate('tweet', 'content')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Notification.countDocuments({ 
                recipient: userId,
                isRead: false 
            });

            // All notifications are unread since read ones are deleted
            const unreadCount = total;

            return {
                notifications,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalNotifications: total,
                    unreadCount
                }
            };
        } catch (error) {
            console.error('Error getting user notifications:', error);
            return null;
        }
    }
}

export default NotificationService;