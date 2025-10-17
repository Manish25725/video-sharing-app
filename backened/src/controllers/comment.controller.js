import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Comment} from "../models/comment.model.js"
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
    const { TweetId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!req.user) {
        throw new ApiError(400, "User must be logged in");
    }

    const comments = await Comment.aggregate([
        {
            $match: {
                tweet: new mongoose.Types.ObjectId(String(TweetId))
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

    const asd= await Comment.create({
        content : content,
        owner : req.user._id,
        tweet : tweetId
    });

    if(! asd ) throw new ApiError(400,"Error while creating a comment on tweet");

    return res
    .status(200)
    .json(
        new ApiResponse(201,"Added a comment on tweet sucessfully",asd)
    )
    
})



const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
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
        content:content,
        owner:req.user._id,
        video:videoId,
    })

    // Note: Comment notifications are not implemented as per requirements (only video and tweet notifications)

    return res
    .status(200)
    .json(
        new ApiResponse(200,addCom,"Comment added successfully")
    )
})


const updateComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params;
    const {content}=req.body;  

    if(!req.user){
        throw new ApiError(400,"user should be logged in")
    }

    if(!content || !content.trim()===""){
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



export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment,
     addCommentOnTweet,
     getTweetComments
    }