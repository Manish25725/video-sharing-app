import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";


export const verifyJWT=asyncHandler(async(req,_,next)=>{
try {
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        
        if(!token){
            throw new ApiError(401,"Unauthorized request");
        }
    
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user){
            //Discuss about forntend...
            throw new ApiError(401,"Invalid AccessToken");
        }
    
        req.user=user;
        next();

} catch (error) {
    throw new ApiError(401,error?.message || "Invalid access token");
}
});

// Optional authentication middleware - doesn't throw error if no token
export const optionalAuth = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        if (token) {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
            
            if (user) {
                req.user = user;
            }
        }
        
        // Continue regardless of authentication status
        next();
    } catch (error) {
        // If there's an error, just continue without setting req.user
        next();
    }
});
