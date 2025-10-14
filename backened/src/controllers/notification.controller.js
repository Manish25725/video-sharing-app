import { mongoose } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Subscription } from "../models/subscription.model.js";
import { Notification } from "../models/notification.model.js";
import NotificationService from "../utils/notificationService.js";

// Get user notifications with pagination
const getUserNotifications = asyncHandler(async (req, res) => {
    if (!req?.user) {
        throw new ApiError(401, "User must be logged in");
    }

    const { page = 1, limit = 20 } = req.query;
    
    try {
        const result = await NotificationService.getUserNotifications(
            req.user._id,
            parseInt(page),
            parseInt(limit)
        );

        if (!result) {
            throw new ApiError(500, "Failed to fetch notifications");
        }

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
        const result = await NotificationService.dismissNotification(notificationId, req.user._id);

        if (!result) {
            throw new ApiError(404, "Notification not found");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, result, "Notification dismissed successfully")
            );
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
        const result = await NotificationService.storeActiveNotifications(req.user._id, activeNotifications);

        return res
            .status(200)
            .json(
                new ApiResponse(200, result, "Active notifications stored successfully")
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
        const result = await NotificationService.markAsRead(notificationId, req.user._id);

        if (!result) {
            throw new ApiError(404, "Notification not found");
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
        const result = await NotificationService.markAllAsRead(req.user._id);

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
    postUploadNotify
};