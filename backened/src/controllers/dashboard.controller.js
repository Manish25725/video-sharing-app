import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";



const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc..
  let data = {
    totalLikes:0,
    totalVideos:0,
    totalViews:0,
    totalSubscribers:0
  };


  if (!req.user) {
    throw new ApiError(401, "user must be logged in");
  }
  const videoStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(String(req.user._id)),
      }
    },
    {
      $lookup: {
        from: "likes", 
        localField: "_id", 
        foreignField: "video", 
        as: "likeDocs",
      }
    },
    {
      $addFields: {
        likesCount: { $size: "$likeDocs" },
      },
    },{
        $lookup:{
            from:"subscriptions",
            localField:"owner",
            foreignField:"channel",
            as:"subscriptionDetails"
        }
    },{
        $addFields:{
            subscriberCount:{
                $size:"$subscriptionDetails"
            }
        }
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
        totalVideos: { $sum: 1 },
        totalLikes: { $sum: "$likesCount" },
        totalSubscribers:{$max:"$subscriberCount"}
      },
    },
  ]);


  if(!videoStats){
    throw new ApiError(400,"Error while fetching details")
  }

  data.totalVideos = videoStats[0].totalVideos;
  data.totalViews = videoStats[0].totalViews;
  data.totalLikes=videoStats[0].totalLikes
  data.totalSubscribers=videoStats[0].totalSubscribers


  return res
  .status(200)
  .json(
    new ApiResponse(200,data,"Details fechted succesully")
  )

});


const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    if(!req.user){
        throw new ApiError(401,"user must be logged in")
    }

    const allVideo=await Video.find({owner:req.user._id}).sort({createdAt: -1})

    // Return empty array if no videos found, don't throw error
    return res
    .status(200)
    .json(
        new ApiResponse(200,allVideo || [],"Successfully fetched all the videos uploaded by the owner")
    )
    
})

export { getChannelStats,getChannelVideos};
