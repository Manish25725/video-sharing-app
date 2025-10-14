import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadNotificationCount,
    deleteNotification,
    dismissNotification,
    storeActiveNotifications,
    videoUploadeNotify,
    postUploadNotify
} from "../controllers/notification.controller.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyJWT);

// Get user notifications with pagination
router.route('/').get(getUserNotifications);

// Get unread notification count
router.route('/unread-count').get(getUnreadNotificationCount);

// Mark specific notification as read
router.route('/:notificationId/read').patch(markNotificationAsRead);

// Dismiss specific notification (cross button)
router.route('/:notificationId/dismiss').patch(dismissNotification);

// Store active notifications when going offline
router.route('/store-active').post(storeActiveNotifications);

// Mark all notifications as read
router.route('/read-all').patch(markAllNotificationsAsRead);

// Delete specific notification
router.route('/:notificationId').delete(deleteNotification);

// Legacy endpoints (keeping for compatibility)
router.route('/video-upload-notify').post(videoUploadeNotify);
router.route('/post-upload-notify').post(postUploadNotify);

export default router;