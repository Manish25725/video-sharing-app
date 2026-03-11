import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import fs from "fs"


const imageFilter=asyncHandler(async (req,_,next)=>{

    if(!req.user){
        throw new ApiError(400,"User should be logged in");
    }

    const allowedImageMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp",
        "image/svg+xml"
    ];

    // Handle array uploads (req.files)
    if(req.files && Array.isArray(req.files) && req.files.length > 0){
        for(const file of req.files){
            if(!allowedImageMimeTypes.includes(file.mimetype)){
                // Remove all uploaded files before throwing
                req.files.forEach(f => { if(fs.existsSync(f.path)) fs.unlinkSync(f.path); });
                throw new ApiError(400,"Only image files are allowed");
            }
        }
        return next();
    }

    // Handle single upload (req.file)
    const file = req.file;
    if(!file){
        return next();
    }

    if(!allowedImageMimeTypes.includes(file.mimetype)){
        fs.unlinkSync(file.path);
        throw new ApiError(400,"Only image files are allowed");
    }
    next();
})

export {imageFilter}
