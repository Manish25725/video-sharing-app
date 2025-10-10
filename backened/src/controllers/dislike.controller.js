import { ApiResponse } from "../utils/Apiresponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Dislike } from "../models/dislike.model.js";
import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoDislike=asyncHandler( async(req,res)=>{
    const {videoId}=req.params;

    if(!req.user) throw  new ApiError(401,"User not authenticated");

    const asd=await Dislike.findOne({
        video:videoId,
        dislikedBy: req.user._id
    })

    if(asd){
        const re= await Dislike.deleteMany({
            video : videoId,
            dislikedBy : req.user._id
        })

        if(!re){
            throw new ApiError(400,"Error while toggling the disliking the video")
        }

        return res
        .status(201)
        .json(
            new ApiResponse(201,re,"Video dislike successfully")
        )
    }

    // Remove any existing like before adding dislike (mutual exclusivity)
    await Like.deleteMany({
        video: videoId,
        likedBy: req.user._id
    })

    const curr=await Dislike.create({
        video : videoId,
        dislikedBy : req.user._id
    })

    if(!curr){
        throw new ApiError(400,"Error while disliking");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,curr,"Disliked the video successfully")
    )
});


const toggleCommentDislike=asyncHandler(async (req,res)=>{

    const {commentId}=req.params;

    if(!req.user) throw new ApiError(404,"User not authorised");

    const asd=await Dislike.findOne({
        comment : commentId,
        dislikedBy : req.user._id
    })

    if(asd){

        const re=await Dislike.deleteMany({
            comment : commentId,
            dislikedBy : req.user._id
        })

        if(!re) throw new ApiError(401,"error while disliking the comment");

        return res
        .status(201)
        .json(
            new ApiResponse(201,re,"Dislked comment successfully")
        )
    }

    // Remove any existing like before adding dislike (mutual exclusivity)
    await Like.deleteMany({
        comment: commentId,
        likedBy: req.user._id
    })

    const ztr=await Dislike.create({
        comment : commentId,
        dislikedBy : req.user._id
    })

    if(!ztr) throw new ApiError(401,"Error while clicking dislike button on comment");

    return res
    .status(201)
    .json(
        new ApiResponse(201,ztr,"Disliked comment successfully")
    )
})


const toggleTweetDislike=asyncHandler(async (req,res)=>{

    const {tweetId}=req.params;

    if(!req.user) throw new ApiError(404,"User not authorised");

    const asd=await Dislike.findOne({
        tweet : tweetId,
        dislikedBy : req.user._id
    })

    if(asd){

        const re=await Dislike.deleteMany({
            tweet : tweetId,
            dislikedBy : req.user._id
        })

        if(!re) throw new ApiError(401,"error while disliking the tweet");

        return res
        .status(201)
        .json(
            new ApiResponse(201,re,"Dislked tweet successfully")
        )
    }

    const ztr=await Dislike.create({
        tweet : tweetId,
        dislikedBy : req.user._id
    })

    if(!ztr) throw new ApiError(401,"Error while clicking dislike button on tweet");

    return res
    .status(201)
    .json(
        new ApiResponse(201,ztr,"Disliked tweet successfully")
    )
})



export {toggleVideoDislike,toggleCommentDislike,toggleTweetDislike}