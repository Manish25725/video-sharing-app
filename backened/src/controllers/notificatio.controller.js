import { mongoose } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { ApiError } from "../utils/ApiError.js";


const notifyToSubscriber= asyncHandler(async (req,res)=>{

    if(!req?.user) return ApiError(404,"User must be logged in");
    
});
