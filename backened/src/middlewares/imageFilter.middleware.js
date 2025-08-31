import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import fs from "fs"


const imageFilter=asyncHandler(async (req,_,next)=>{

    if(!req.user){
        throw new ApiError(400,"User should be logged in");
    }

    const file=req.file;

    if(!file){
        return next();
    }

    const allowedImageMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/svg+xml"
    ];

    if(!allowedImageMimeTypes.includes(file.mimetype)){
        fs.unlinkSync(file.path);
        throw new ApiError(400,"only image is required");
    }
    next();
})

export {imageFilter}
