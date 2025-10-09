import { Router } from "express";
import { toggleVideoDislike,toggleTweetDislike,toggleCommentDislike } from "../controllers/dislike.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

router.route("/toggle-video-dislike/:videoId").get(verifyJWT,toggleVideoDislike);

router.route("/toogle-comment-dislike/:commentId").get(verifyJWT,toggleCommentDislike);

router.route("/toggle-tweet-dislike/:tweeetId").get(verifyJWT,toggleTweetDislike);

export default router