import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { Comment } from "../models/comment.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";

// Simple health check endpoint
const healthCheck = asyncHandler(async (req, res) => {
    try {
        // Test database connectivity by counting documents
        const commentCount = await Comment.countDocuments();
        const userCount = await User.countDocuments();
        const videoCount = await Video.countDocuments();
        
        return res.status(200).json(
            new ApiResponse(200, {
                database: "connected",
                comments: commentCount,
                users: userCount,
                videos: videoCount,
                timestamp: new Date().toISOString()
            }, "Health check successful")
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(500, {
                database: "error",
                error: error.message
            }, "Health check failed")
        );
    }
});

export { healthCheck };