import {Router} from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    getVideoComments,
    addComment, 
    updateComment, 
    deleteComment, 
    addCommentOnTweet, 
    getTweetComments,
    addReply,
    addReplyToReply,
    getCommentReplies,
    getReplyReplies,
    getVideoCommentsEnhanced
} from "../controllers/comment.controller.js";

const router=Router();

// Video comment routes
router.route("/get-video-comment/:videoId").get(verifyJWT,getVideoComments)
router.route("/get-video-comments-enhanced/:videoId").get(verifyJWT,getVideoCommentsEnhanced)
router.route("/add-comment/:videoId").post(verifyJWT,addComment);

// Tweet comment routes
router.route("/get-tweet-comment/:tweetId").get(verifyJWT,getTweetComments);
router.route("/add-comment-tweet/:tweetId").post(verifyJWT,addCommentOnTweet)

// Comment management routes
router.route("/update-comment/:commentId").patch(verifyJWT,updateComment)
router.route("/delete-comment/:commentId").delete(verifyJWT,deleteComment)

// Reply routes
router.route("/add-reply/:commentId").post(verifyJWT,addReply);
router.route("/add-reply-to-reply/:replyId").post(verifyJWT,addReplyToReply);
router.route("/get-replies/:commentId").get(verifyJWT,getCommentReplies);
router.route("/get-reply-replies/:replyId").get(verifyJWT,getReplyReplies);

export default router

