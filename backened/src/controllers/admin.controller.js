import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Report } from "../models/report.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Global Stats (Admin)
const getGlobalStats = asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalVideos = await Video.countDocuments();
    const totalReports = await Report.countDocuments({ status: "pending" });
    const totalViewsAgg = await Video.aggregate([{ $group: { _id: null, totalViews: { $sum: "$views" } } }]);
    const totalViews = totalViewsAgg.length > 0 ? totalViewsAgg[0].totalViews : 0;
    
    return res.status(200).json(
        new ApiResponse(200, { totalUsers, totalVideos, totalViews, totalReports }, "Admin stats fetched successfully")
    );
});

// Users Management (Admin)
const getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const filter = {};
    if (search) {
        filter.$or = [
            { fullName: { $regex: search, $options: "i" } },
            { userName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
        ];
    }
    
    const users = await User.find(filter)
        .select("-password -refreshToken")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
        
    const total = await User.countDocuments(filter);
    
    return res.status(200).json(
        new ApiResponse(200, { users, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) }, "Users fetched successfully")
    );
});

const toggleUserStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body; 

    if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, "Invalid userId");

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    // Add status field if doesn't exist logically, assuming Active/Banned logic
    user.status = status;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, user, `User status updated to ${status}`));
});

// Video Management (Admin)
const getAllVideosAdmin = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const filter = {};
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
        ];
    }
    
    const videos = await Video.find(filter)
        .populate("owner", "fullName userName avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
        
    const total = await Video.countDocuments(filter);
    
    return res.status(200).json(
        new ApiResponse(200, { videos, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) }, "Videos fetched successfully")
    );
});

const deleteVideoAdmin = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully by admin"));
});

// Comments Management (Admin)
const getAllCommentsAdmin = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const comments = await Comment.find()
        .populate("owner", "fullName userName avatar")
        .populate("video", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
        
    const total = await Comment.countDocuments();
    
    return res.status(200).json(
        new ApiResponse(200, { comments, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) }, "Comments fetched successfully")
    );
});

const deleteCommentAdmin = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!mongoose.isValidObjectId(commentId)) throw new ApiError(400, "Invalid commentId");

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully by admin"));
});

export {
    getGlobalStats,
    getAllUsers,
    toggleUserStatus,
    getAllVideosAdmin,
    deleteVideoAdmin,
    getAllCommentsAdmin,
    deleteCommentAdmin
};
