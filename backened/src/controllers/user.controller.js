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

const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
});


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

    const {refreshToken,accessToken}=await generateAccessAndRefreshToken(user._id);
    
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500,"Something went wrong while regestering the user");
    }

    return res.
        status(201)
        .cookie("accessToken",accessToken,{
            httpOnly:true,
        })
        .cookie("refreshToken",refreshToken,{
            httpOnly:true
        })
        .json(
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

        const options = getCookieOptions();

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

    const options = getCookieOptions();

    return res
    .status(201)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(201,{},"User logged out"));
})



const refreshAccessToken=asyncHandler(async(req,res)=>{
   try {
     const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;
 
     if(!incomingRefreshToken){
         throw new ApiError(401,"unauthorized request");
     }
 
     const decodedToken=jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
     )
 
     const user=await User.findById(decodedToken?._id);
     if(!user){
         throw new ApiError(400,"Invalid refresh token");
     }
 
     if(incomingRefreshToken !==user?.refreshToken){
         throw new ApiError(400,"Refresh token is expired or used");
     }
 
     const options = getCookieOptions();
 
     const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);
 
     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",refreshToken,options)
     .json(
         new ApiResponse(
             200,
             {
                 accessToken,
                 refreshToken
             },
             "Acces token refreshed"
         )
     );
   } catch (error) {
       throw new ApiError(error?.statusCode || 401, error?.message || "Invalid refresh token");
   } 
});


const changeCurrentPassword=asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword}=req.body;
    const user=await User.findById(req.user?._id);

    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);
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
    if (!req.user) {
        return res
        .status(200)
        .json(new ApiResponse(200,null,"No authenticated user"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"current user fetched succuessfully"))
})



const updateDetails= asyncHandler(async (req,res)=>{

    const {fullName, email, bio}=req.body

    if(!fullName){
        throw new ApiError(400,"Full name is required");
    }

    const updateFields = { fullName };
    if (email) updateFields.email = email;
    if (bio !== undefined) updateFields.bio = bio;

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        { $set: updateFields },
        {new : true}    
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
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
        new ApiResponse(200,user,"avatar image updated succuessfully")
    )
})


const updateUserCoverImage=asyncHandler(async (req,res)=>{

    const coverImageLocalPath=req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image is missing");
    }

    const coverImage=await uploadOnCloudinary(coverImageLocalPath);

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




const addToWatchHistory = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    if (!req.user || !req.user?._id) {
        throw new ApiError(401, "User not logged in");
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Use req.user directly - no need to fetch from database again
    const user = req.user;

    // Create watch history entry
    const watchEntry = {
        videoDetail: videoId,
        watchedAt: new Date()
    };

    // Remove existing entry if present to avoid duplicates
    user.watchHistory = user.watchHistory.filter(
        entry => entry.videoDetail.toString() !== videoId
    );

    // Add new entry at the beginning (most recent first)
    user.watchHistory.unshift(watchEntry);

    // Keep only last 100 entries to prevent unlimited growth
    if (user.watchHistory.length > 100) {
        user.watchHistory = user.watchHistory.slice(0, 100);
    }

    await user.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, watchEntry, "Video added to watch history successfully")
        );
});


const getWatchHistory = asyncHandler(async (req, res) => {
    if (!req.user || !req.user._id) {
        throw new ApiError(401, "User not logged in");
    }

    // Use req.user directly and populate watch history
    await req.user.populate({
        path: "watchHistory.videoDetail",
        populate: {
            path: "owner",
            select: "fullName userName avatar coverImage" 
        },
        select: "title description thumbnail duration views createdAt isPublished"
    });

    // Filter out any videos that might have been deleted or unpublished
    const validWatchHistory = req.user.watchHistory.filter(
        entry => entry.videoDetail && entry.videoDetail.isPublished
    );

    // Sort by watchedAt in descending order (most recent first)
    validWatchHistory.sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));

    return res
        .status(200)
        .json(
            new ApiResponse(200, validWatchHistory, "Watch history fetched successfully")
        );
});


const getWatchLater=asyncHandler(async(req,res)=>{

    if(!req.user || !req.user?._id){
        throw new ApiError(401,"User is not logged in");
    }

    // If no watch later videos, return empty array
    if (!req.user.watchLater || req.user.watchLater.length === 0) {
        return res
        .status(200)
        .json(
            new ApiResponse(200, [], "Watch later videos fetched successfully")
        )
    }

    // Populate watchLater videos directly on req.user
    await req.user.populate({
        path: "watchLater",
        match: { isPublished: true }, // Only get published videos
        populate: {
            path: "owner",
            select: "fullName userName avatar coverImage"
        },
        select: "title description thumbnail duration views createdAt"
    });

    console.log("Found watch later videos:", req.user.watchLater.length);

    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user.watchLater, "Watch later videos fetched successfully")
    )
})



// Get just the video IDs in watch later list (for frontend state checking)
const getWatchLaterIds = asyncHandler(async (req, res) => {
    if (!req.user || !req.user?._id) {
        throw new ApiError(401, "User is not logged in");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user.watchLater || [], "Watch later video IDs fetched successfully")
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

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const { userName } = req.params;
    
    if (!userName?.trim()) {
        throw new ApiError(400, "Username is required");
    }

    // Find user by username or ID
    const channel = await User.aggregate([
        {
            $match: {
                $or: [
                    { userName: userName.toLowerCase() },
                    { _id: mongoose.Types.ObjectId.isValid(userName) ? new mongoose.Types.ObjectId(userName) : null }
                ]
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions", 
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { 
                            $and: [
                                { $ne: [req.user?._id, null] },
                                { $in: [req.user?._id, "$subscribers.subscriber"] }
                            ]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                createdAt: 1
            }
        }
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
})


const toggleNotifyOnPost=asyncHandler( async (req,res)=>{

    if(!req?.user) return new ApiError(404,"User must be logged in");

    const user=req.user;
    user.notifyOnPost=!user.notifyOnPost;
    await user.save();

    return res
    .status(201)
    .json(
        new ApiResponse(200,user,"Toggled successfully")
    )
})

const toggleNotifyOnVideo=asyncHandler(async (req,res)=>{

    if(!req?.user) return new ApiError(404,"User must be logged in");

    const user=req.user;
    user.notifyOnVideo=!user.notifyOnVideo;
    await user.save();

    return res
    .status(201)
    .json(
        new ApiResponse(201,user,"Toggled successfully")
    )
})

const toggleNotifyOnComment=asyncHandler(async (req,res)=>{

    if(!req?.user) return new ApiError(404,"User must be logged in");

    const user=req.user;
    user.notifyOnComment=!user.notifyOnComment;
    await user.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Toggled successfully")
    )
})

const toggleNotifyOnMention=asyncHandler(async (req,res)=>{

    if(!req?.user) return new ApiError(404,"User must be logged in");

    const user=req.user;
    user.notifyOnMention=!user.notifyOnMention;
    await user.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Toggled successfully")
    )
})

const toggleNotifyOnEmail=asyncHandler(async (req,res)=>{

    if(!req?.user) return new ApiError(404,"User must be logged in");

    const user=req.user;
    user.notifyOnEmail=!user.notifyOnEmail;
    await user.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Toggled successfully")
    )
})


const updateLanguage = asyncHandler(async (req, res) => {
    const { language } = req.body;

    if (!["en", "hi"].includes(language)) {
        throw new ApiError(400, "Invalid language. Supported: en, hi");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { language },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Language updated successfully"));
});


// ─── Switch Account helpers ───────────────────────────────────────────────────

// Read the list of saved account IDs from the signed JWT cookie
const getSavedAccountIds = (req) => {
    try {
        const token = req.cookies?.savedAccounts;
        if (!token) return [];
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        return Array.isArray(decoded.userIds) ? decoded.userIds : [];
    } catch {
        return [];
    }
};

// Build a signed JWT that holds the saved account IDs
const createSavedAccountsToken = (userIds) => {
    return jwt.sign({ userIds }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
};

// Shared cookie options for the savedAccounts cookie (30-day persistence)
const savedAccountsCookieOptions = () => ({
    ...getCookieOptions(),
    maxAge: 30 * 24 * 60 * 60 * 1000
});

// POST /users/add-account
// Log in a second account and add it to the saved accounts list.
// Does NOT change the currently active session.
const addAccount = asyncHandler(async (req, res) => {
    const { email, userName, password } = req.body;

    if (!(userName || email)) throw new ApiError(400, "Username or email is required");
    if (!password) throw new ApiError(400, "Password is required");

    const userExist = await User.findOne({ $or: [{ userName }, { email }] });
    if (!userExist) throw new ApiError(404, "User does not exist");

    const passwordCheck = await userExist.isPasswordCorrect(password);
    if (!passwordCheck) throw new ApiError(401, "Password is incorrect");

    // Prevent adding the currently active account again
    if (req.user && req.user._id.toString() === userExist._id.toString()) {
        throw new ApiError(400, "This account is already the active account");
    }

    let savedIds = getSavedAccountIds(req);

    // Persist the currently active account in the list so the user can switch back
    if (req.user && !savedIds.includes(req.user._id.toString())) {
        savedIds.push(req.user._id.toString());
    }

    // Add the newly authenticated account
    if (!savedIds.includes(userExist._id.toString())) {
        savedIds.push(userExist._id.toString());
    }

    const accountInfo = await User.findById(userExist._id)
        .select('_id userName fullName avatar email');

    return res
        .status(200)
        .cookie('savedAccounts', createSavedAccountsToken(savedIds), savedAccountsCookieOptions())
        .json(new ApiResponse(200, accountInfo, "Account added successfully"));
});

// POST /users/switch-account
// Switch the active session to a previously saved account.
const switchAccount = asyncHandler(async (req, res) => {
    const { targetUserId } = req.body;

    if (!targetUserId) throw new ApiError(400, "Target user ID is required");
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) throw new ApiError(400, "Invalid user ID");

    const savedIds = getSavedAccountIds(req);
    if (!savedIds.includes(targetUserId)) {
        throw new ApiError(403, "Account not in saved accounts list. Add the account first.");
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) throw new ApiError(404, "User not found");

    // Keep the current account in the saved list (so we can switch back)
    let updatedSavedIds = [...savedIds];
    if (req.user && !updatedSavedIds.includes(req.user._id.toString())) {
        updatedSavedIds.push(req.user._id.toString());
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(targetUser._id);
    const loggedInUser = await User.findById(targetUser._id).select('-password -refreshToken');

    const options = getCookieOptions();

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .cookie('savedAccounts', createSavedAccountsToken(updatedSavedIds), savedAccountsCookieOptions())
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "Switched account successfully"));
});

// GET /users/saved-accounts
// Return basic profile info for every account in the saved list.
const getSavedAccounts = asyncHandler(async (req, res) => {
    const savedIds = getSavedAccountIds(req);

    if (savedIds.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "No saved accounts"));
    }

    const objectIds = savedIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));

    const accounts = await User.find({ _id: { $in: objectIds } })
        .select('_id userName fullName avatar email');

    return res.status(200).json(new ApiResponse(200, accounts, "Saved accounts fetched successfully"));
});

// DELETE /users/saved-accounts/:accountId
// Remove an account from the saved list (does not log that account out).
const removeAccount = asyncHandler(async (req, res) => {
    const { accountId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(accountId)) throw new ApiError(400, "Invalid account ID");

    if (req.user && req.user._id.toString() === accountId) {
        throw new ApiError(400, "Cannot remove the currently active account. Sign out first.");
    }

    let savedIds = getSavedAccountIds(req);
    savedIds = savedIds.filter(id => id !== accountId);

    return res
        .status(200)
        .cookie('savedAccounts', createSavedAccountsToken(savedIds), savedAccountsCookieOptions())
        .json(new ApiResponse(200, { removedAccountId: accountId }, "Account removed from saved accounts"));
});

// ─────────────────────────────────────────────────────────────────────────────

export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getWatchHistory,
    addToWatchHistory,
    getWatchLater,
    getWatchLaterIds,
    addToWatchLater,
    removeFromWatchLater,
    getUserChannelProfile,
    toggleNotifyOnPost,
    toggleNotifyOnVideo,
    toggleNotifyOnComment,
    toggleNotifyOnMention,
    toggleNotifyOnEmail,
    addAccount,
    switchAccount,
    getSavedAccounts,
    removeAccount,
    updateLanguage
};


