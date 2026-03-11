import {Router} from "express"
import { verifyJWT, optionalAuth } from "../middlewares/auth.middleware.js"
import { createTweet, deleteTweet, getUserTweets, updateTweet, getTweetsByUser, toggleComments, votePoll } from "../controllers/tweet.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { imageFilter } from "../middlewares/imageFilter.middleware.js";

const router=Router();

// images: up to 4 photos per tweet
router.route("/create-tweet").post(verifyJWT, upload.array("images", 4), imageFilter, createTweet)
router.route("/get-tweet").get(verifyJWT, getUserTweets)
router.route("/get-tweets/:userId").get(optionalAuth, getTweetsByUser)
router.route("/update-tweet/:tweetId").patch(verifyJWT, updateTweet)
router.route("/remove-tweet/:tweetId").delete(verifyJWT, deleteTweet)
router.route("/toggle-comments/:tweetId").patch(verifyJWT, toggleComments)
router.route("/vote-poll/:tweetId").post(verifyJWT, votePoll)

export default router