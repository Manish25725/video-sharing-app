import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";


const router=Router()

router.route("/toggle-video-like/:videoId").get(verifyJWT,toggleVideoLike)
router.route("/toggle-comment-like/:commentId").get(verifyJWT,toggleCommentLike)
router.route("/toggle-tweet-like/:tweetId").get(verifyJWT,toggleTweetLike)
router.route("/get-liked-videos").get(verifyJWT,getLikedVideos)

export default router



