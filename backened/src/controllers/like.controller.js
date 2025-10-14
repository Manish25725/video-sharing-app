import mongoose from "mongoose";
import { ApiResponse } from "../utils/Apiresponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Like } from "../models/like.model.js";
import { Dislike } from "../models/dislike.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { updateUserAvatar } from "./user.controller.js";


const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!req.user){
        throw new ApiError(401,"user should be logged in")
    }

    if(!mongoose.Types.ObjectId.isValid(String(videoId))){
        throw new ApiError(400,"Video Id is invalid");
    }

    const likedet=await Like.findOne({
        video:videoId,
        likedBy:req.user._id
    })

    if(likedet){
        const re=await Like.deleteOne({
            video:videoId,
            likedBy:req.user._id
        })

        if(re.deletedCount==0){
            throw new ApiError(400,"Error while unliking")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200,re,"Unlike the video")
        )
    }

    // Remove any existing dislike before adding like (mutual exclusivity)
    await Dislike.deleteMany({
        video: videoId,
        dislikedBy: req.user._id
    })

    const creatLike=await Like.create({
        video:videoId,
        likedBy:req.user._id,
    })

    if(!creatLike){
        throw new ApiError(400,"Error while liking")
    }

    // Note: Like notifications are not implemented as per requirements (only video and tweet notifications)

    return res
    .status(200)
    .json(
        new ApiResponse(200,creatLike,"Clicked in like successfully")
    )

})


const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!req.user){
        throw new ApiError(401,"user must be logged in")
    }

    if(!mongoose.Types.ObjectId.isValid(String(commentId))){
        throw new ApiError(400,"Comment Id invalid")
    }

    const comLike=await Like.findOne({
        comment:commentId,
        likedBy:req.user._id
    })

    if(comLike){
        const delLike=await Like.deleteMany({
            comment:commentId,
            likedBy:req.user._id
        })

        if(!delLike){
            throw new ApiError(500,"Error while unliking a comment")
        }
        return res
        .status(200)
        .json(
            new ApiResponse(200,delLike,"Comment unliked successfully")
        )
    }

    // Remove any existing dislike before adding like (mutual exclusivity)
    await Dislike.deleteMany({
        comment: commentId,
        dislikedBy: req.user._id
    })

    const commentLike=await Like.create({
        comment:commentId,
        likedBy:req.user._id
    })

    if(!commentLike){
        throw new ApiError(400,"Error while liking a comment")
    }

    // Note: Comment like notifications are not implemented as per requirements (only video and tweet notifications)

    return res
    .status(200)
    .json(
        new ApiResponse(200,commentLike,"CommentLiked Successfully")
    )
})



const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!req.user){
        throw new ApiError(401,"User must be logged in")
    }

    if(!mongoose.Types.ObjectId.isValid(String(tweetId))){
        throw new ApiError(400,"Tweet Id is invalid")
    }

    const isLike=await Like.findOne({
        likedBy:req.user._id,
        tweet:tweetId
    })

    if(isLike){
        const re=await Like.deleteMany({
            likedBy:req.user._id,
            tweet:tweetId
        })

        if(!re){
            throw new ApiError(500,"Error while unliked a tweet")
        }
        return res
        .status(200)
        .json(
            new ApiResponse(200,re,"Tweet unliked successfully")
        )
    }

    const twtLike=await Like.create({
        likedBy:req.user._id,
        tweet:tweetId
    })

    if(!twtLike){
        throw new ApiError(500,"Error while liking a tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,twtLike,"Tweet Liked Successfully")
    )
}
)


const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    if(!req.user){
        throw new ApiError(400,"user must be logged in")
    }

    const getLike=await Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(String(req.user._id)),
                video: { $exists: true, $ne: null }
            }
        },{
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videoDetails",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"userDetails",
                            pipeline:[
                                {
                                    $lookup:{
                                        from:"subscriptions",
                                        localField:"_id",
                                        foreignField:"channel",
                                        as:"subscribers"
                                    }
                                },
                                {
                                    $addFields:{
                                        subscribersCount: {$size: "$subscribers"}
                                    }
                                },
                                {
                                    $project:{
                                        userName:1,
                                        fullName:1,
                                        avatar:1,
                                        coverImage:1,
                                        email:1,
                                        subscribersCount:1,
                                    }
                                }
                            ]
                        }
                    },{
                        $addFields:{
                            userDetails:{
                                $arrayElemAt:["$userDetails",0]
                            }
                        }
                    }
                ]
            }
        },{
            $addFields:{
                videoDetails:{
                    $arrayElemAt:["$videoDetails",0]
                }
            }
        }
    ])

    if(!getLike){
        throw new ApiError("Error while fetching a liked video")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,getLike,"Liked videos fetched successfully")
    )
})






export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}