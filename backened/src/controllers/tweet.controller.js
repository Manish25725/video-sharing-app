import mongoose from "mongoose";
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/Apiresponse.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { notifyTweetPost } from "./notification.controller.js";

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content}=req.body

    if(!req.user){
        throw new ApiError(401,"User must be logged in")
    }

    if(!mongoose.Types.ObjectId.isValid(String(req.user._id))){
        throw new ApiError(400,"User Id is invalid")
    }

    if(!content|| content.trim()===""){
        throw new ApiError(400,"Content should not be empty")
    }

    const creatTwt=await Tweet.create({
        content:content,
        owner:req.user._id
    })

    if(!creatTwt){
        throw new ApiError(500,"Error while creating a tweet")
    }

    // Send notification to subscribers who have enabled post notifications
    try {
        await NotificationService.notifyTweetPost(req.user._id, content, creatTwt._id);
    } catch (error) {
        console.error('Error sending tweet post notifications:', error);
        // Don't fail the tweet creation if notification fails
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,creatTwt,"Tweet created Successfully")
    )
})


const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {limit=10,page=1}=req.query

    //user must be logged in

    if(!req.user){
        throw new ApiError(401,"User must be logged in ")
    }

    const allTwt=await Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(String(req.user._id))   
            }
        },{
            $project:{
                content:1,
                createdAt:1,
                updatedAt:1,
            }
        },{
            $skip:(Number(page-1))*(Number(limit))
        },{
            $limit:Number(limit)
        }
    ])


    if(!allTwt){
        throw new ApiError(500,"Error while fetching tweets")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,allTwt,"Tweets fetched Successfully")
    )


})


const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId}= req.params
    const {content} =req.body

    if(!req.user){
        throw new ApiError(401,"user must be logged in")
    }

    if(!content || content.trim()===""){
        throw new ApiError(400,"Tweet should not be empty")
    }

    if(!mongoose.Types.ObjectId.isValid(String(tweetId))){
        throw new ApiError(400,"Tweet Id must be valid")
    }

    const update=await Tweet.findOneAndUpdate(
        {
            owner:req.user._id,
            _id:tweetId
        },{
            $set:{
                content:content.trim()
            }
        },{
            new:true
        }
    ).select("content")

    if(!update){
        throw new ApiError(500,"Error while updating a tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,update,"Tweet updated Sucessfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId}=req.params

    if(!req.user){
        throw new ApiError(401,"user must be logged in")
    }

    if(!mongoose.Types.ObjectId.isValid(String(tweetId))){
        throw new ApiError(400,"Tweet Id invalid")
    }

    const delTwt=await Tweet.deleteOne({
        owner:req.user._id,
        _id:tweetId
    })

    if(delTwt.deletedCount === 0){
        throw new ApiError(500,"Error while deleting a tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,delTwt,"Tweet deleted successfully")
    )

})


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
