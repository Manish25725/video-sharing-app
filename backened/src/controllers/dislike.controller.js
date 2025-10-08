import { ApiResponse } from "../utils/Apiresponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Dislike } from "../models/dislike.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoDislike=asyncHandler( async(req,res)=>{
    const {videoId}=req.params;

    if(!req.user || !req.user?._id) throw  new ApiError(401,"User not authenticated");

    const asd=await Dislike.findOne({
        video:videoId,
        dislikedBy: req.user._id
    })

    if(asd){
        const re= await Dislike.deletOne({
            video : videoId,
            dislikedBy : req.user._id
        })

        if(re.deleteCount ==0){
            throw new ApiError(400,"Error while toggling the disliking the video")
        }
    }

    const curr=await Dislike.create({
        video : videoId,
    })


})

const toggleCommentDislike=asyncHandler((req,res)=>{

})

const toggleTweetDislike=asyncHandler((req,res)=>{

})


export {toggleVideoDislike,toggleCommentDislike,toggleTweetDislike}