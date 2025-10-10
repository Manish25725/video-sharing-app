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

            // Create notification in database
            const notification = await Notification.create({
                recipient,
                sender,
                type,
                message,
                video,
                comment,
                tweet
            });

            // Populate sender information for socket emission
            await notification.populate('sender', 'userName fullName avatar');

            // Send real-time notification via socket if io is available
            if (global.io) {
                const notificationData = {
                    id: notification._id,
                    type,
                    message,
                    sender: {
                        id: notification.sender._id,
                        userName: notification.sender.userName,
                        fullName: notification.sender.fullName,
                        avatar: notification.sender.avatar
                    },
                    video,
                    comment,
                    tweet,
                    createdAt: notification.createdAt,
                    isRead: false
                };

                // Emit to user's personal notification room
                global.io.to(`user:${recipient}`).emit('new-notification', notificationData);
                console.log(`Notification sent to user:${recipient}`, notificationData);

                // Mark as sent
                notification.isSent = true;
                await notification.save();
            }

            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            return null;
        }
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

    // Mark notification as read
    static async markAsRead(notificationId, userId) {
        try {
            return await Notification.findOneAndUpdate(
                { _id: notificationId, recipient: userId },
                { isRead: true },
                { new: true }
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return null;
        }
    }

    // Mark all notifications as read for a user
    static async markAllAsRead(userId) {
        try {
            return await Notification.updateMany(
                { recipient: userId, isRead: false },
                { isRead: true }
            );
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return null;
        }
    }

    // Get user notifications
    static async getUserNotifications(userId, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            
            const notifications = await Notification.find({ recipient: userId })
                .populate('sender', 'userName fullName avatar')
                .populate('video', 'title thumbnail')
                .populate('comment', 'content')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Notification.countDocuments({ recipient: userId });
            const unreadCount = await Notification.countDocuments({ 
                recipient: userId, 
                isRead: false 
            });

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