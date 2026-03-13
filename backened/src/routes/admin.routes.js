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
import { verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyAdmin);

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
