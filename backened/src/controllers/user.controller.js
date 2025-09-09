import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {Video} from "../models/video.model.js"
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


const generateAccessAndRefreshToken =async(userId)=>{

    const user=await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken=refreshToken;
    await user.save({validateBeforeSave:false});

    return {accessToken,refreshToken};
}


const registerUser= asyncHandler(async (req,res)=>{

    // get the details from the frontened...
    //validation  - not empty
    // check if user already exist :username ,email
    //check for images ,check for images
    //upload them ot cloudinary,avatar
    //create user object-create entry in db
    //remove password and referesh token field from response
    //check for user creation
    //return res

     if (!req.body) {
        throw new ApiError(400, "Request body is missing");
    }

    const {fullName,email,userName,password}=req.body;
    console.log("email",email);

    if(
        [fullName,userName,password,email].some((field)=>( field?.trim() === ""))
    ){
        throw new ApiError(400,"All fields are required");
    }

    const existedUser=await User.findOne({
        $or:[{ userName },{ email }]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exists");
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

    console.log("Files received:", req.files);
    console.log("Avatar local path:", avatarLocalPath);
    console.log("Cover image local path:", coverImageLocalPath);

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover image is required");
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);

    console.log("Avatar upload result:", avatar);
    console.log("Cover image upload result:", coverImage);

    if(!avatar?.url){
        throw new ApiError(400,"Avatar file is required");
    }

    if(!coverImage?.url){
        throw new ApiError(400,"Cover image is required");
    }


    const user= await User.create({
        avatar:avatar.url,
        coverImage:coverImage.url,
        email,
        password,
        userName:userName.toLowerCase(),
        fullName
    })

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500,"Something went wrong while regestering the user");
    }

    return res.status(201).json(
        new ApiResponse(201,createdUser,"User registered Successfully")
    
    )
})


const loginUser= asyncHandler( async(req,res)=>{
        // req->body
        //username or email
        //check for user
        //password check
        //acces token and refresh token generate 
        //send cookie
        const {email,userName,password} = req.body;
         if(!(userName || email)) throw new ApiError(404,"username or email is required");

        const userExist= await User.findOne({
            $or:[{userName},{email}]
         });

        if(!userExist) throw new ApiError(404,"User does not exist");

        const passwordCheck=await userExist.isPasswordCorrect(password);
        if(!passwordCheck) throw new ApiError(401,"Password is incorrect");

        const {accessToken,refreshToken}=await generateAccessAndRefreshToken(userExist._id);
        const loggedInUser=await User.findById(userExist._id).select("-password -refreshToken");

        const options={
            httpOnly:true,
            secure:true
        };

        console.log(loggedInUser);
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(200,
                {
                    user:loggedInUser,accessToken,refreshToken,
                },
                "User logged in sucessfully"
            )
        ) 
});


const logoutUser = asyncHandler( async (req,res)=>{
    await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    );

    const options={
        httpOnly:true,
        secure:true
    };

    return res
    .status(201)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(201,{},"User logged out"));
})



const refreshAccessToken=asyncHandler(async(req,res)=>{
   try {
     const incomingAccessToken=req.cookies.refreshToken || req.body.refreshToken;
 
     if(!incomingAccessToken){
         throw new ApiError(401,"unauthorized request");
     }
 
     const decodedToken=jwt.verify(
        incomingAccessToken,
        process.env.REFRESH_TOKEN_SECRET
     )
 
     const user=await User.findById(decodedToken?._id);
     if(!user){
         throw new ApiError(400,"Invalid refresh token");
     }
 
     if(incomingAccessToken !==user?.refreshToken){
         throw new ApiError(400,"Refresh token is expired or used");
     }
 
     const options={
         httpOnly:true,
         secure:true
     }
 
     const {newAccesstoken,newRefreshToken}=await generateAccessAndRefreshToken(user._id);
 
     return res
     .status(200)
     .cookie("accesstoken",newAccesstoken,options)
     .cookie("refreshtoken",newRefreshToken,options)
     .json(
         new ApiResponse(
             200,
             {
                 accessToken:newAccesstoken,
                 refreshToken:newRefreshToken
             },
             "Acces token refreshed"
         )
     );
   } catch (error) {
        throw new ApiError(400,error?.message || "Invalid refresh token");
   } 
});


const changeCurrentPassword=asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword}=req.body;
    const user=await User.findById(req.user?._id);

    const isPasswordCorrect=user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password");
    }
    user.password=newPassword;
    await user.save({validateBeforeSave:false});

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Password chnaged successfully")
    )
})


const getCurrentUser=asyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current user fetched succuessfully")
})



const updateDetails= asyncHandler(async (req,res)=>{

    const {fullName,email}=req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required");
    }

    const user=User.findByIdAndUpdate(
        req.user?._id
        ,
         {
            $set:{
                fullName,
                email:email
            }
        },
        {new : true}    
    ).select("-password");

    return res
    .status(200)
    .json(200,user,"Account details updated successfully")
})


const updateUserAvatar=asyncHandler(async (req,res)=>{
    const avatarLocalPath=req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing");
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading");
    }

    // deleting previous file from cloudinary
    const asd=req.user?.avatar
    deleteOnCloudinary(asd);


    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        { new :true}
    ).select("-password");

    //deleting old one from cloudinary

    return res
    .status(200)
    .json(
        new ApiError(200,user,"avatar image updated succuessfully")
    )
})


const updateUserCoverImage=asyncHandler(async (req,res)=>{

    const coverImageLocalPath=req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image is missing");
    }

    const coverImage=uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading an coverImage")
    }

    //delete older files from cloudinary
    const asd=req.user.coverImage;
    deleteOnCloudinary(asd);

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            coverImage:coverImage.url
        },
        {
            new:true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"cover image updated successfully")
    )
})




const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {userName} = req.params

    if(!userName?.trim()){
        throw new ApiError(400,"username is missing");
    }
    
    const channel=await User.aggregate([
        {
            $match:{
                userName:userName?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as :"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"$subscribedTo"
                },

                isSubscribed:{
                    $cond:{
                        if : {$in : [req.user?._id,"$subscribers.subscriber"]},
                        then :true,
                        else :false 
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                userName:1,
                subscribersCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
                email:1,
                coverImage:1,
                avatar:1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(400,"channel does not ecen exist");
    }
    console.log(channel);

    return res
    .status(200)
    .json(
        new ApiResponse(400,channel[0],"User channel fetched sucessfully")
    )

})


const getWatchHistory=asyncHandler(async (req,res)=>{

    if(!req.user){
        throw new ApiError(401,"User must be logged in");
    }

    const user=await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        userName:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    if(!user?.length){
        throw new ApiError(404,"User not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,user[0].watchHistory || [],"Watch history fetched successfully")
    )
})


const getWatchLater=asyncHandler(async(req,res)=>{

    if(!req.user || !req.user?._id){
        throw new ApiError(401,"User is not logged in");
    }

    // First get the user with watchLater IDs
    const user = await User.findById(req.user._id).select("watchLater");
    
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    console.log("User watchLater IDs:", user.watchLater);

    // If no watch later videos, return empty array
    if (!user.watchLater || user.watchLater.length === 0) {
        return res
        .status(200)
        .json(
            new ApiResponse(200, [], "Watch later videos fetched successfully")
        )
    }

    // Get the actual video documents
    const watchLaterVideos = await Video.find({
        _id: { $in: user.watchLater },
        isPublished: true
    }).populate({
        path: "owner",
        select: "fullName userName avatar"
    });

    console.log("Found watch later videos:", watchLaterVideos.length);

    return res
    .status(200)
    .json(
        new ApiResponse(200, watchLaterVideos, "Watch later videos fetched successfully")
    )
})

// Get just the video IDs in watch later list (for frontend state checking)
const getWatchLaterIds = asyncHandler(async (req, res) => {
    if (!req.user || !req.user?._id) {
        throw new ApiError(401, "User is not logged in");
    }

    const user = await User.findById(req.user._id).select("watchLater");
    
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, user.watchLater || [], "Watch later video IDs fetched successfully")
    )
})


const addToWatchLater = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    if (!req.user){
        throw new ApiError(401, "User must be logged in");
    }

    // Fetch fresh user data to get the most up-to-date watchLater array
    const currentUser = await User.findById(req.user._id).select("watchLater");
    
    if (!currentUser) {
        throw new ApiError(404, "User not found");
    }

    // Check if video is already in watch later using fresh data
    if (currentUser.watchLater && currentUser.watchLater.includes(videoId)) {
        throw new ApiError(400, "Video already in watch later list");
    }

    // Add video to watch later
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $addToSet: { watchLater: videoId }
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedUser, "Video added to watch later successfully")
    );
});


const removeFromWatchLater = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    if (!req.user) {
        throw new ApiError(401, "User must be logged in");
    }

    // Remove video from watch later
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $pull: { watchLater: videoId }
        },
        { new: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedUser, "Video removed from watch later successfully")
    );
});

export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    getWatchLater,
    getWatchLaterIds,
    addToWatchLater,
    removeFromWatchLater
};


