import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Comment} from "../models/comment.model.js"
import {Reply} from "../models/reply.model.js"
import {Video} from "../models/video.model.js"
import mongoose from "mongoose";
import { ApiResponse } from "../utils/Apiresponse.js";


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!req.user){
        throw new ApiError(400,"user must be logged in");
    }

    const getAllComment=await Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(String(videoId))
            }
        },{
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"userDetails",
                pipeline:[
                    {
                        $project:{
                            userName:1,
                            fullName:1,
                            email:1,
                            avatar:1
                        }
                    }
                ]
            }
        },{
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"likes"
            }
        },{
            $lookup:{
                from:"dislikes",
                localField:"_id",
                foreignField:"comment",
                as:"dislikes"
            }
        },{
            $addFields:{
                userDetails:{
                     $arrayElemAt:["$userDetails",0]
                },
                likesCount: { $size: "$likes" },
                dislikesCount: { $size: "$dislikes" },
                isLikedByUser: {
                    $in: [req.user._id, "$likes.likedBy"]
                },
                isDislikedByUser: {
                    $in: [req.user._id, "$dislikes.dislikedBy"]
                }
            }
        },{
            $project: {
                content: 1,
                owner: 1,
                video: 1,
                replies: 1,
                createdAt: 1,
                updatedAt: 1,
                userDetails: 1,
                likesCount: 1,
                dislikesCount: 1,
                isLikedByUser: 1,
                isDislikedByUser: 1
            }
        },{
            $skip:(Number(page)-1)*(Number(limit))
        },{
            $limit:Number(limit)
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,getAllComment,"All Comment fetched successfully")
    )

})



const getTweetComments = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!req.user) {
        throw new ApiError(400, "User must be logged in");
    }

    const comments = await Comment.aggregate([
        {
            $match: {
                tweet: new mongoose.Types.ObjectId(String(tweetId))
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "userDetails",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "like"
            }
        },
        {
            $lookup: {
                from: "dislikes",
                localField: "_id",
                foreignField: "comment",
                as: "dislike"
            }
        },
        {
            $addFields: {
                userDetails: { $arrayElemAt: ["$userDetails", 0] },
                likesCount: { $size: "$like" },
                dislikesCount: { $size: "$dislike" },
                isLikedByUser: {
                    $in: [req.user._id, "$like.likedBy"]
                },
                isDislikedByUser: {
                    $in: [req.user._id, "$dislike.dislikedBy"]
                }
            }
        },
        { $skip: (page - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
    ]);

    res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
});


const addCommentOnTweet=asyncHandler( async(req,res) =>{
    //TODO : add a comment to a tweet
    const {tweetId} = req.params;
    const {content}  = req.body;

    if(!req.user){
        throw new ApiError(400,"user must be logged in")
    }

    if(!content || content.trim()===""){
        throw new ApiError(400,"Content should not be empty")
    }

    if(!mongoose.Types.ObjectId.isValid(tweetId)) throw new ApiError(400,"Invalid tweetId");

    const asd = await Comment.create({
        content : content,
        owner : req.user._id,
        tweet : tweetId
    });

    if(! asd ) throw new ApiError(400,"Error while creating a comment on tweet");

    const populatedComment = await Comment.findById(asd._id).populate({
        path: "owner",
        select: "fullName userName avatar _id"
    });

    return res
    .status(201)
    .json(
        new ApiResponse(201,populatedComment,"Added a comment on tweet sucessfully")
    )
    
})



const addComment = asyncHandler(async (req, res) => {
    
    const {videoId}=req.params
    const {content}=req.body

    if(!req.user){
        throw new ApiError(400,"user must be logged in")
    }

    if(!content || content.trim()===""){
        throw new ApiError(400,"Content should not be empty")
    }

    
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const addCom=await Comment.create({
        content:content.trim(),
        owner:req.user._id,
        video:videoId,
    })


    // Also fetch the comment with user details to ensure proper response
    const populatedComment = await Comment.findById(addCom._id)
        .populate('owner', 'userName fullName avatar')
        .lean();
    

    // Note: Comment notifications are not implemented as per requirements (only video and tweet notifications)

    return res
    .status(201)
    .json(
        new ApiResponse(201, populatedComment, "Comment added successfully")
    )
})


const updateComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params;
    const {content}=req.body;  

    if(!req.user){
        throw new ApiError(400,"user should be logged in")
    }

    if(!content || content.trim()===""){
        throw new ApiError(400,"Content should not be empty")
    }

    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400,"Comment Id is invalid")
    }

    const update=await Comment.findOneAndUpdate(
        {
            _id:commentId,owner:req.user._id
        },
        {
            $set:{
                content:content.trim()
            }
        },{
            new:true
        }
    ).select("content")

    if(!update){
        throw new ApiError(400,"Error while updating a comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,update,"Comments updated successfully")
    )
})


const deleteComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params

    if(!req.user){
        throw new ApiError(400,"User must be logged in")
    }

    const comm=await Comment.findOneAndDelete({_id:commentId,owner:req.user._id})

    if(!comm){
        throw new ApiError(400,"Error while deleting a comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Comment deleted successfully")
    )
})

// Add reply to a comment
const addReply = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!req.user) {
        throw new ApiError(401, "User must be logged in");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Reply content is required");
    }

    // Check if parent comment exists
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
        throw new ApiError(404, "Parent comment not found");
    }

    // Create reply using Reply model
    const reply = await Reply.create({
        content: content.trim(),
        owner: req.user._id,
        comment: commentId,
        video: parentComment.video,
        tweet: parentComment.tweet,
        level: 1
    });

    if (!reply) {
        throw new ApiError(500, "Failed to create reply");
    }

    // Populate reply with user details
    const populatedReply = await Reply.findById(reply._id)
        .populate("owner", "userName fullName avatar");

    // Increment the parent comment's reply count
    await Comment.findByIdAndUpdate(commentId, { $inc: { totalReplies: 1 } });

    return res
        .status(201)
        .json(
            new ApiResponse(201, populatedReply, "Reply added successfully")
        );
});

// Add reply to a reply (nested reply)
const addReplyToReply = asyncHandler(async (req, res) => {
    const { replyId } = req.params;
    const { content } = req.body;

    if (!req.user) {
        throw new ApiError(401, "User must be logged in");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Reply content is required");
    }

    // Check if parent reply exists
    const parentReply = await Reply.findById(replyId);
    if (!parentReply) {
        throw new ApiError(404, "Parent reply not found");
    }

    // Check nesting level limit
    if (parentReply.level >= 5) {
        throw new ApiError(400, "Maximum reply nesting level reached");
    }

    // Create nested reply
    const reply = await Reply.create({
        content: content.trim(),
        owner: req.user._id,
        parentReply: replyId,
        video: parentReply.video,
        tweet: parentReply.tweet,
        level: parentReply.level + 1
    });

    if (!reply) {
        throw new ApiError(500, "Failed to create reply");
    }

    // Populate reply with user details
    const populatedReply = await Reply.findById(reply._id)
        .populate("owner", "userName fullName avatar");

    return res
        .status(201)
        .json(
            new ApiResponse(201, populatedReply, "Nested reply added successfully")
        );
});

// Get replies for a specific comment
const getCommentReplies = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!req.user) {
        throw new ApiError(401, "User must be logged in");
    }

    const replies = await Reply.aggregate([
        {
            $match: {
                comment: new mongoose.Types.ObjectId(commentId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "userDetails",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "reply",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "dislikes",
                localField: "_id",
                foreignField: "reply",
                as: "dislikes"
            }
        },
        {
            $addFields: {
                userDetails: { $arrayElemAt: ["$userDetails", 0] },
                likesCount: { $size: "$likes" },
                dislikesCount: { $size: "$dislikes" },
                isLikedByUser: {
                    $in: [req.user._id, "$likes.likedBy"]
                },
                isDislikedByUser: {
                    $in: [req.user._id, "$dislikes.dislikedBy"]
                }
            }
        },
        {
            $project: {
                content: 1,
                owner: 1,
                comment: 1,
                level: 1,
                totalReplies: 1,
                createdAt: 1,
                updatedAt: 1,
                userDetails: 1,
                likesCount: 1,
                dislikesCount: 1,
                isLikedByUser: 1,
                isDislikedByUser: 1
            }
        },
        {
            $sort: { createdAt: 1 } // Replies sorted chronologically
        },
        {
            $skip: (Number(page) - 1) * Number(limit)
        },
        {
            $limit: Number(limit)
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(200, replies, "Replies fetched successfully")
        );
});

// Get nested replies for a specific reply
const getReplyReplies = asyncHandler(async (req, res) => {
    const { replyId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!req.user) {
        throw new ApiError(401, "User must be logged in");
    }

    const nestedReplies = await Reply.aggregate([
        {
            $match: {
                parentReply: new mongoose.Types.ObjectId(replyId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "userDetails",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "reply",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "dislikes",
                localField: "_id",
                foreignField: "reply",
                as: "dislikes"
            }
        },
        {
            $addFields: {
                userDetails: { $arrayElemAt: ["$userDetails", 0] },
                likesCount: { $size: "$likes" },
                dislikesCount: { $size: "$dislikes" },
                isLikedByUser: {
                    $in: [req.user._id, "$likes.likedBy"]
                },
                isDislikedByUser: {
                    $in: [req.user._id, "$dislikes.dislikedBy"]
                }
            }
        },
        {
            $project: {
                content: 1,
                owner: 1,
                parentReply: 1,
                level: 1,
                totalReplies: 1,
                createdAt: 1,
                updatedAt: 1,
                userDetails: 1,
                likesCount: 1,
                dislikesCount: 1,
                isLikedByUser: 1,
                isDislikedByUser: 1
            }
        },
        {
            $sort: { createdAt: 1 } // Nested replies sorted chronologically
        },
        {
            $skip: (Number(page) - 1) * Number(limit)
        },
        {
            $limit: Number(limit)
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(200, nestedReplies, "Nested replies fetched successfully")
        );
});

// Update the getVideoComments to exclude replies from main comments
const getVideoCommentsEnhanced = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    

    if(!req.user){
        throw new ApiError(400,"user must be logged in");
    }

    
    // First, let's check all comments for this video (for debugging)
    const allCommentsForVideo = await Comment.find({ video: videoId }).lean();
    
    const getAllComment=await Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(String(videoId))
            }
        },{
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"userDetails",
                pipeline:[
                    {
                        $project:{
                            userName:1,
                            fullName:1,
                            email:1,
                            avatar:1
                        }
                    }
                ]
            }
        },{
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"likes"
            }
        },{
            $lookup:{
                from:"dislikes",
                localField:"_id",
                foreignField:"comment",
                as:"dislikes"
            }
        },{
            $addFields:{
                userDetails:{
                     $arrayElemAt:["$userDetails",0]
                },
                likesCount: { $size: "$likes" },
                dislikesCount: { $size: "$dislikes" },
                isLikedByUser: {
                    $in: [req.user._id, "$likes.likedBy"]
                },
                isDislikedByUser: {
                    $in: [req.user._id, "$dislikes.dislikedBy"]
                }
            }
        },{
            $project: {
                content: 1,
                owner: 1,
                video: 1,
                totalReplies: 1,
                createdAt: 1,
                updatedAt: 1,
                userDetails: 1,
                likesCount: 1,
                dislikesCount: 1,
                isLikedByUser: 1,
                isDislikedByUser: 1
            }
        },{
            $sort: { createdAt: -1 } // Most recent comments first
        },{
            $skip:(Number(page)-1)*(Number(limit))
        },{
            $limit:Number(limit)
        }
    ])


    return res
    .status(200)
    .json(
        new ApiResponse(200,getAllComment,"All Comments fetched successfully")
    )
});

export {
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
    }