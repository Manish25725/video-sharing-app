import { ApiResponse } from "../utils/Apiresponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import NotificationService from "../utils/notificationService.js";


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(!req.user){
        throw new ApiError(404,"user must be logged in ")
    }

    if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid or missing channelId");
  }


    const toggleSubs=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(String(channelId))
            }
        },
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
                isSubscribed:{
                    $cond:{
                        if: {$in:[req.user._id,"$subscribers.subscriber"]},
                        then:true,
                        else: false
                    }
                }
            }
        }
    ])


    const isSubscribed=toggleSubs[0].isSubscribed
    let re;

    if(isSubscribed){
        //if true then undo it by deleting
        re=await Subscription.deleteOne({ 
            subscriber:req.user._id,
            channel:channelId 
        });
        if(!re){
            throw new ApiError(400,"Error while unsubscribing a channel")
        }
    }
    else{
        //if false ,then subscribe and save it in subscription
        re=await Subscription.create({
            channel:channelId,
            subscriber:req.user._id
        })
        if(!re){
            throw new ApiError(404,"Error while subscribing a channel")
        }

        // Send subscription notification to channel owner
        try {
            await NotificationService.notifySubscription(channelId, req.user._id);
        } catch (notificationError) {
            console.error('Error sending subscription notification:', notificationError);
            // Don't fail the main operation if notification fails
        }
    }

    // Get updated subscriber count
    const subscriberCount = await Subscription.countDocuments({ channel: channelId });

    return res
    .status(200)
    .json(
        new ApiResponse(200,{
            isSubscribed:!isSubscribed,
            subscriberCount: subscriberCount
        },"Toggled Subscription Sucessfully")
    )

})


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!req.user){
        throw new ApiError(400,"user must be logged in");
    }

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }

    const getSubs=await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(String(channelId))
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscribers",
                pipeline:[
                    {
                        $project:{
                            userName:1,
                            fullName:1,
                            email:1,
                            avatar:1,
                            coverImage:1,
                        }
                    }

                ]
            }
        }
    ])


    const asd = getSubs.flatMap(sub => sub.subscribers || []);
    const m = asd.length === 0? "No subscribers found" :  "All subscribers of a channel";

    return res
    .status(200)
    .json(
        new ApiResponse(200,asd,m)
    )
})


// controller to return channel list to which user has subscribed

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!req.user){
        throw new ApiError(404,"user should be logged in");
    }

    if(!mongoose.Types.ObjectId.isValid(subscriberId)){
        throw new ApiError(404,"SubscriberId is invalid")
    }

    const channelSubs=await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(String(subscriberId))
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"subscribedtoWhichChannel",
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
                            email:1,
                            avatar:1,
                            coverImage:1,
                            subscribersCount:1
                        }
                    }
                ]
            }
        }
    ])

    const asd=channelSubs.flatMap(ele=>ele.subscribedtoWhichChannel || [])
    const m=asd.length!==0? "List of Channel  User has Subscribed": "No channel exist"

    return res
    .status(200)
    .json(
        new ApiResponse(200,asd,m)
    )
})

// Check if user is subscribed to a specific channel
const checkSubscriptionStatus = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if(!req.user){
        throw new ApiError(401,"User must be logged in");
    }

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    const subscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    });

    const isSubscribed = !!subscription;

    return res
    .status(200)
    .json(
        new ApiResponse(200, { isSubscribed }, "Subscription status fetched successfully")
    )
})


export {toggleSubscription,getUserChannelSubscribers,getSubscribedChannels,checkSubscriptionStatus}