
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import fs from "fs"

const videoFilter =asyncHandler(async (req,res,next)=>{


    if(!req.user){
        throw new ApiError(400,"User should be logged in");
    }
    const asd=req.file;
    if(!asd){
        throw new ApiError(400,"No file uploaded");
    }

    const allowedMimeTypes = [
    "video/mp4",
    "video/mpeg",
    "video/x-matroska",
    "video/quicktime",
    "video/webm",
    "video/avi"
  ];

   if(!allowedMimeTypes.includes(asd.mimetype)){
        fs.unlinkSync(asd.path);
        throw new ApiError(400,"Only video files (mp4, mkv, mov, etc..) are allowed");
   }
   next();
})

export {videoFilter}

