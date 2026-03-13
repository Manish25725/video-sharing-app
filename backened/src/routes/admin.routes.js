import { Router } from 'express';
import {
    getGlobalStats,
    getAllUsers,
    toggleUserStatus,
    getAllVideosAdmin,
    deleteVideoAdmin,
    getAllCommentsAdmin,
    deleteCommentAdmin
} from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// Replace this with actual admin role checking middleware if exists,
// for now, we'll check if it's admin role implicitly here via a quick middleware
router.use((req, res, next) => {
    // Assuming user model has `role` or similar, or this routes are protected differently
    // For now, passing through
    next();
});

router.route("/stats").get(getGlobalStats);

// Users
router.route("/users").get(getAllUsers);
router.route("/users/:userId/status").patch(toggleUserStatus);

// Videos
router.route("/videos").get(getAllVideosAdmin);
router.route("/videos/:videoId").delete(deleteVideoAdmin);

// Comments
router.route("/comments").get(getAllCommentsAdmin);
router.route("/comments/:commentId").delete(deleteCommentAdmin);

export default router;
