import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";


export const verifyJWT = asyncHandler(async (req, _, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if (!token) throw new ApiError(401, "Unauthorized request");

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch {
        throw new ApiError(401, "Invalid or expired access token");
    }

    const user = await User.findById(decodedToken._id).select("-password -refreshToken -sessions");
    if (!user) throw new ApiError(401, "Invalid access token");

    req.user = user;
    next();
});

export const optionalAuth = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if (token) {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decodedToken._id).select("-password -refreshToken -sessions");
            if (user) req.user = user;
        }
    } catch {
        // No-op: optional auth — proceed without user
    }
    next();
});

export const verifyAdmin = asyncHandler(async (req, res, next) => {
    const adminKey = req.header("x-admin-key");
    if (adminKey && adminKey === (process.env.ADMIN_KEY || 'playvibe_admin_2025')) {
        req.isAdmin = true;
        return next();
    }
    throw new ApiError(401, "Admin unauthorized");
});
