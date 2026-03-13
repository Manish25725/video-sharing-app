import mongoose from "mongoose";
import fs from "fs";
import {Tweet} from "../models/tweet.model.js"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/Apiresponse.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { notifyTweetPost } from "./notification.controller.js";

/* ─── helpers ─── */
const tweetLookup = (userId) => [
    {
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"ownerDetails",
            pipeline:[{ $project:{ userName:1, fullName:1, avatar:1 } }]
        }
    },
    {
        $lookup:{
            from:"likes",
            localField:"_id",
            foreignField:"tweet",
            as:"likes"
        }
    },
    {
        $lookup:{
            from:"comments",
            localField:"_id",
            foreignField:"tweet",
            as:"commentsArr"
        }
    },
    {
        $addFields:{
            ownerDetails:{ $arrayElemAt:["$ownerDetails",0] },
            likesCount:{ $size:"$likes" },
            commentsCount:{ $size:"$commentsArr" },
            isLikedByUser:{ $in:[new mongoose.Types.ObjectId(String(userId)), "$likes.likedBy"] }
        }
    },
    {
        $project:{
            content:1, images:1, poll:1, commentsEnabled:1,
            createdAt:1, updatedAt:1, owner:1,
            ownerDetails:1, likesCount:1, commentsCount:1, isLikedByUser:1
        }
    },
    { $sort:{ createdAt:-1 } }
];


/* ─── create tweet ─── */
const createTweet = asyncHandler(async (req, res) => {
    if(!req.user) throw new ApiError(401,"User must be logged in");

    const { content, pollQuestion, pollOptions, pollMultiple, pollEndsAt, commentsEnabled } = req.body;

    const hasImages = req.files && req.files.length > 0;
    const hasPoll = pollQuestion && pollQuestion.trim() && pollOptions;
    
    if((!content || content.trim()==="") && !hasImages && !hasPoll) {
        throw new ApiError(400,"Content, at least one image, or a poll is required");
    }

    // Upload images
    const imageUrls = [];
    if(req.files && req.files.length > 0){
        for(const file of req.files){
            const uploaded = await uploadOnCloudinary(file.path);
            if(uploaded?.url) imageUrls.push(uploaded.url);
            else if(fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
    }

    // Build poll if provided
    let poll = undefined;
    if(pollQuestion && pollQuestion.trim()){
        let options = [];
        try { options = JSON.parse(pollOptions || "[]"); } catch { options = []; }
        if(Array.isArray(options) && options.length >= 2){
            poll = {
                question: pollQuestion.trim(),
                options: options.map(o => ({ text: String(o), votes: [] })),
                multipleChoice: pollMultiple === "true" || pollMultiple === true,
                endsAt: pollEndsAt ? new Date(pollEndsAt) : undefined
            };
        }
    }

    const tweet = await Tweet.create({
        content: content?.trim() || "",
        owner: req.user._id,
        images: imageUrls,
        ...(poll && { poll }),
        commentsEnabled: commentsEnabled !== "false" && commentsEnabled !== false
    });

    if(!tweet) throw new ApiError(500,"Error while creating a tweet");

    try { await notifyTweetPost(req.user._id, content, tweet._id); } catch(e){ /* non-fatal */ }

    return res.status(200).json(new ApiResponse(200, tweet, "Tweet created successfully"));
});


/* ─── get MY tweets ─── */
const getUserTweets = asyncHandler(async (req, res) => {
    if(!req.user) throw new ApiError(401,"User must be logged in");

    const { limit=10, page=1 } = req.query;

    const pipeline = [
        { $match:{ owner: new mongoose.Types.ObjectId(String(req.user._id)) } },
        ...tweetLookup(req.user._id),
        { $skip:(Number(page)-1)*Number(limit) },
        { $limit:Number(limit) }
    ];

    const tweets = await Tweet.aggregate(pipeline);
    return res.status(200).json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});


/* ─── get tweets by any user (for channel page) ─── */
const getTweetsByUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { limit=10, page=1 } = req.query;

    if(!mongoose.Types.ObjectId.isValid(userId)) throw new ApiError(400,"Invalid userId");

    const viewerId = req.user?._id || new mongoose.Types.ObjectId();

    const pipeline = [
        { $match:{ owner: new mongoose.Types.ObjectId(String(userId)) } },
        ...tweetLookup(viewerId),
        { $skip:(Number(page)-1)*Number(limit) },
        { $limit:Number(limit) }
    ];

    const tweets = await Tweet.aggregate(pipeline);
    return res.status(200).json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});


/* ─── update tweet ─── */
const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    if(!req.user) throw new ApiError(401,"User must be logged in");
    if(!content || content.trim()==="") throw new ApiError(400,"Tweet should not be empty");
    if(!mongoose.Types.ObjectId.isValid(tweetId)) throw new ApiError(400,"Invalid tweetId");

    const update = await Tweet.findOneAndUpdate(
        { owner: req.user._id, _id: tweetId },
        { $set:{ content: content.trim() } },
        { new:true }
    ).select("content");

    if(!update) throw new ApiError(404,"Tweet not found or unauthorized");
    return res.status(200).json(new ApiResponse(200, update, "Tweet updated successfully"));
});


/* ─── delete tweet ─── */
const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if(!req.user) throw new ApiError(401,"User must be logged in");
    if(!mongoose.Types.ObjectId.isValid(tweetId)) throw new ApiError(400,"Invalid tweetId");

    const del = await Tweet.deleteOne({ owner: req.user._id, _id: tweetId });
    if(del.deletedCount === 0) throw new ApiError(404,"Tweet not found or unauthorized");

    await Comment.deleteMany({ tweet: tweetId });

    return res.status(200).json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});


/* ─── toggle comments enabled ─── */
const toggleComments = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if(!req.user) throw new ApiError(401,"User must be logged in");
    if(!mongoose.Types.ObjectId.isValid(tweetId)) throw new ApiError(400,"Invalid tweetId");

    const tweet = await Tweet.findOne({ _id: tweetId, owner: req.user._id });
    if(!tweet) throw new ApiError(404,"Tweet not found or unauthorized");

    tweet.commentsEnabled = !tweet.commentsEnabled;
    await tweet.save();

    return res.status(200).json(new ApiResponse(200, { commentsEnabled: tweet.commentsEnabled }, "Comments toggled"));
});


/* ─── vote on a poll option ─── */
const votePoll = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { optionIndex } = req.body;
    if(!req.user) throw new ApiError(401,"User must be logged in");
    if(!mongoose.Types.ObjectId.isValid(tweetId)) throw new ApiError(400,"Invalid tweetId");

    const tweet = await Tweet.findById(tweetId);
    if(!tweet || !tweet.poll || !tweet.poll.options.length) throw new ApiError(404,"Poll not found");

    if(tweet.poll.endsAt && new Date() > tweet.poll.endsAt) throw new ApiError(400,"Poll has ended");

    const idx = Number(optionIndex);
    if(isNaN(idx) || idx < 0 || idx >= tweet.poll.options.length) throw new ApiError(400,"Invalid option index");

    const userId = req.user._id;

    if(!tweet.poll.multipleChoice){
        tweet.poll.options.forEach(opt => {
            opt.votes = opt.votes.filter(v => String(v) !== String(userId));
        });
    }

    const alreadyVoted = tweet.poll.options[idx].votes.some(v => String(v) === String(userId));
    if(alreadyVoted){
        tweet.poll.options[idx].votes = tweet.poll.options[idx].votes.filter(v => String(v) !== String(userId));
    } else {
        tweet.poll.options[idx].votes.push(userId);
    }

    tweet.markModified("poll");
    await tweet.save();

    const sanitized = tweet.poll.options.map((opt) => ({
        text: opt.text,
        voteCount: opt.votes.length,
        votedByUser: opt.votes.some(v => String(v) === String(userId))
    }));

    return res.status(200).json(new ApiResponse(200, { options: sanitized }, "Vote recorded"));
});


export {
    createTweet,
    getUserTweets,
    getTweetsByUser,
    updateTweet,
    deleteTweet,
    toggleComments,
    votePoll
}
