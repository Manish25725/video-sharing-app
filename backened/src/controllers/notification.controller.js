import { mongoose } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Subscription } from "../models/subscription.model.js";



const videoUploadeNotify=asyncHandler(async(req,res)=>{

    // const {videoId}=req.params;
    // const {content }=req.body;

    if(!req?.user) throw new ApiError(404,"User must be logged in");

    const notify=await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"noted",
                pipeline:[
                    {
                        $match:{
                            notifyOnVideo:true
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(201)
    .json(
        new ApiResponse(201,notify,"fetched successfully")
    )
})


const postUploadNotify=asyncHandler(async(req,res)=>{

        //const {postid}=req.params;
        //const {content}=req.body

    if(!req?.user) throw new ApiError(404,"User must be logged in");


    const notify=await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"noted",
                pipeline:[
                    {
                        $match:{
                            notifyOnPost:true
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(201)
    .json(
        new ApiResponse(201,notify,"fetched successfully")
    )
})


export {
    videoUploadeNotify,
    postUploadNotify
}