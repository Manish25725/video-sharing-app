import {Router} from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getVideoComments,addComment, updateComment, deleteComment, addCommentOnTweet, getTweetComments } from "../controllers/comment.controller.js";


const router=Router();
router.route("/get-video-comment/:videoId").get(verifyJWT,getVideoComments)
router.route("/get-tweet-comment/:tweetId").get(verifyJWT,getTweetComments);
router.route("/add-comment/:videoId").post(verifyJWT,addComment);
router.route("/update-comment/:commentId").patch(verifyJWT,updateComment)
router.route("/delete-comment/:commentId").delete(verifyJWT,deleteComment)
router.route("/add-comment-tweet/:tweetId").post(verifyJWT,addCommentOnTweet)


export default router

