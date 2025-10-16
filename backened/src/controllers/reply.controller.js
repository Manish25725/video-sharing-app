import { ApiResponse } from "../utils/Apiresponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Reply } from "../models/reply.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createReplyOnComment=asyncHandler(async(req,res)=>{
    const {content} = req.body;
    const {commentId} =req.params;
    if(!req.user || !req.user?._id){
        throw new ApiError(404,"User not authenticated");
    }

    const repl = await Reply.create({
        comment : commentId,
        owner : req.user._id,
        content : content,
    });

    if(!repl) throw new ApiError(401,"Error while creating a reply");

    return res
    .status(201)
    .json(
        new ApiResponse(201,"Reply created succesfully",repl)
    )
});




export {createReplyOnComment}