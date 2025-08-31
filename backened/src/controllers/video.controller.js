import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary,deleteOnCloudinary } from "../utils/cloudinary.js";


//for trending ..

const getTrendingVideos=asyncHandler(async (req,res)=>{

    //user is logged in or not ....

    if(!req.user){
        throw new ApiError(400,"user not logged in ")
    }

    if(!mongoose.Types.ObjectId.isValid(String(req.user._id))){
            throw new ApiError(400,"User Id is invalid")
    }

     const trendingVideos = await Video.aggregate([
      // 1. Match only published videos
      {
        $match: {
          isPublished: true,
          isBlocked: { $ne: true }
        }
      },

      // 2. Calculate hours since the video was uploaded
      {
        $addFields: {
          hoursSinceUpload: {
            $divide: [
              { $subtract: ["$$NOW", "$createdAt"] }, // time difference
              1000 * 60 * 60                      // convert ms → hours
            ]
          }
        }
      },

      // 3. Calculate trending score (simplified to use only views and recency)
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: [{ $ifNull: ["$views", 0] }, 1] }, // weight for views

              // Freshness bonus: newer videos rank higher
              {
                $multiply: [
                  { $divide: [1, { $add: ["$hoursSinceUpload", 1] }] },
                  50
                ]
              }
            ]
          }
        }
      },

      // 4. Lookup owner details
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                userName: 1,
                fullName: 1,
                avatar: 1
              }
            }
          ]
        }
      },

      // 5. Unwind owner array
      { $unwind: "$owner" },

      // 6. Sort videos by score
      { $sort: { score: -1 } },

      // 7. Limit to top 20
      { $limit: 20 },

      // 8. Project final fields
      {
        $project: {
          _id: 1,
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          duration: 1,
          views: 1,
          isPublished: 1,
          owner: 1,
          createdAt: 1,
          updatedAt: 1,
          score: 1
        }
      }
    ]);

    return res
    .status(201)
    .json(
        new ApiResponse(201,trendingVideos,"trending videos succuessfully")
    )
})

const getAllVideos = asyncHandler(async (req, res) => {
  // Handle both POST (with body) and GET (with query) requests
  const requestData = req.method === 'POST' ? req.body : req.query;
  let { page = 1, limit = 10, query="", sortBy="createdAt", sortType="desc", userId=""} = requestData;
  
  //TODO: get all videos based on query, sort, pagination
  userId = userId ? userId.trim() : "";
  query = query ? query.trim() : "";

  // Optional authentication - user may or may not be logged in
  // if (!req.user) {
  //   throw new ApiError(400, "user should be logged in");
  // }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter = { isPublished: true }; // Always filter for published videos

  if (query){
    filter.$or = [
      {
        title: {
          $regex: query,
          $options: "i",
        },
      },
      {
        description: {
          $regex: query,
          $options: "i",
        },
      },
    ];
  }

  if(userId){
    if(mongoose.Types.ObjectId.isValid(userId)){
      filter.owner = new mongoose.Types.ObjectId(String(userId))
    }
    else{
      const axd = await User.findOne({userName:userId}).select("_id");
      if(axd) filter.owner = axd._id;
    }
  }

  const vidoes = await Video.aggregate([
        {
            $match:filter
        },{
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as :"owner",
                pipeline:[
                    {
                        $lookup:{
                            from:"subscriptions",
                            localField:"_id",
                            foreignField:"channel",
                            as:"subscribers"
                        }
                    },
                    {
                        $addFields:{
                            subscribersCount: {$size: "$subscribers"}
                        }
                    },
                    {
                        $project:{
                            fullName:1,
                            userName:1,
                            email:1,
                            avatar:1,
                            subscribersCount:1,
                        }
                    }
                ]
            }
        },{

            $addFields:{
                owner:{
                    $arrayElemAt:["$owner",0]
                }
            }
        },

        {
            $project:{
                videoFile:1,
                description:1,
                title:1,
                duration:1,
                thumbnail:1,
                views:1,
                isPublished:1,
                createdAt:1,
                updatedAt:1,
                owner:1
            }
        },
       {
            $sort:{
                [sortBy]: sortType== 'desc' ? -1 : 1
            }
        },
        {
            $skip:skip
        },
         {
            $limit:parseInt(limit)
        },
    ])


    return res
    .status(200)
    .json(
        new ApiResponse(200,vidoes,"videos fetched succuessfully")
    )

});


const publishVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!req.user){
        throw new ApiError(400,"User needs to be logged in");
    }

    const videoLocalPath=req.files?.video[0]?.path;
    const thumbnailPath=req.files?.thumbnail[0]?.path;
    console.log(videoLocalPath);
    if(!videoLocalPath){
        throw new ApiError(400,"Video path invalid");
    }
    
    if(!thumbnailPath){
        throw new ApiError(400,"thumbnail path not valid");
    }

    // upload on cloidinary..
    const asd=await uploadOnCloudinary(videoLocalPath);

    if(!asd){
        throw new ApiError(400,"Error will uploading a video");
    }

    //upload thumbnail on cloudinary...
    const uploadThumbnail=await uploadOnCloudinary(thumbnailPath);

    if(!uploadThumbnail){
        throw new ApiError(404,"Error whilw uploading a thumbnail file");
    }

    const video=await Video.create({
        videoFile:asd?.url || "",
        thumbnail:uploadThumbnail?.url,
        owner:req.user._id,
        duration:asd.duration || 0,
        views:0,
        isPublished:true,
        title:title,
        description:description
    })

    if(!video){
        throw new ApiError(200,"Errror will uploading a data in database");
    }


    return res
    .status(200)
    .json(
        new ApiResponse(201,video,"Video uploaded  successfully")
    )

})




const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    // Optional authentication - user may or may not be logged in
    // if(!req.user){
    //     throw new ApiError(400,"User should logged in");
    // }

    const video=await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(String(videoId))
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $lookup:{
                            from:"subscriptions",
                            localField:"_id",
                            foreignField:"channel",
                            as:"subscribers"
                        }
                    },
                    {
                        $addFields:{
                            subscribersCount: {$size: "$subscribers"}
                        }
                    },
                    {
                        $project:{
                            userName:1,
                            fullName:1,
                            avatar:1,
                            email:1,
                            coverImage:1,
                            subscribersCount:1,
                        }
                    }
                ]
            }
        },{
            $addFields:{
                owner:{
                    $arrayElemAt:["$owner",0]
                }
            }
        },{
            $project:{
                videoFile:1,
                duration:1,
                title:1,
                description:1,
                thumbnail:1,
                views:1,
                owner:1,
                createdAt:1,
                updatedAt:1,
                isPublished:1,
            }
        }
    ])


    if(!video.length){
        throw new ApiError(404,"Video not found");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,video[0],"video fteched successfully")
    )
})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const title=req.body?.title;
    const description=req.body?.description;

    if(!req.user){
        throw new ApiError(400,"User should be logged in");
    }

    const updateData={};
    if(title) updateData.title=title;
    if(description) updateData.description=description;

    if(req.file && req.file.path){
        const re=await uploadOnCloudinary(req.file.path);
        if(!re){
            throw new ApiResponse(400,"Error wile uploading thumbnail");
        }
        updateData.thumbnail=re.url;
        console.log(re.url);

        //deleting previous thumbnail file from cloudinary if want to update thumbnail
        const vid=await Video.findById(videoId);
        if(!vid){
            throw new ApiError(404,"Video Id invalid");
        }
        const deletepreviousThumbnail=await deleteOnCloudinary(vid?.thumbnail);
        if(!deletepreviousThumbnail){
            throw new ApiError(404,"Deleted previois thumbnail file");
        }
    }

    const asd=await Video.findByIdAndUpdate(
        videoId,
        {
           $set: updateData
        },
        {
            new:true
        }
    )

    if(!asd){
        throw new ApiError(406,"Video not found");
    }


    return res
    .status(200)
    .json(
        new ApiResponse(200,asd,"Details updated sucuessfully")
    )
})



const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    //user loggedin or not
    if(!req.user){
        throw new ApiError(404,"User must be loggedin")
    }
    const vid=await Video.findByIdAndDelete(videoId);
    if(!vid){
        throw new ApiError(404,"Error while deleting a video");
    }

    return res
    .status(202)
    .json(
        new ApiResponse(202,vid,"Video deleted sucessfully")
    )
})


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
     const isPublished = req.query.isPublished === "true";

    const vid=await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                isPublished
            }
        },
        {
            new:true
        }
    );

    if(!vid){
        throw new ApiError(404,"vidoe does not exist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,vid,"publish status chnage successfully")
    )

})

const incrementVideoViews = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Increment the view count
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { new: true, select: "views" }
    );

    if (!updatedVideo) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, { views: updatedVideo.views }, "View count updated successfully")
        );
});

const getVideoStats = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Get user ID if authenticated, otherwise null
    const userId = req.user ? req.user._id : null;
    console.log("Getting video stats for videoId:", videoId, "userId:", userId);

    // Get video with like count and user's like status
    const videoStats = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                isLikedByUser: userId ? {
                    $in: [userId, "$likes.likedBy"]
                } : false
            }
        },
        {
            $project: {
                views: 1,
                likesCount: 1,
                isLikedByUser: 1
            }
        }
    ]);

    if (!videoStats || videoStats.length === 0) {
        throw new ApiError(404, "Video not found");
    }

    console.log("Video stats result:", videoStats[0]);

    return res
        .status(200)
        .json(
            new ApiResponse(200, videoStats[0], "Video stats fetched successfully")
        );
});

// Download video controller - Simple Cloudinary approach
const downloadVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Get video from database
    const video = await Video.findById(videoId);
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (!video.isPublished) {
        // Only allow owner to download unpublished videos
        if (!req.user || req.user._id.toString() !== video.owner.toString()) {
            throw new ApiError(403, "Video is not publicly available");
        }
    }

    if (!video.videoFile) {
        throw new ApiError(400, "Video file not available for download");
    }

    try {
        // Convert Cloudinary URL to download URL using fl_attachment flag
        const downloadUrl = video.videoFile.replace("/upload/", "/upload/fl_attachment/");
        
        // Create a clean filename
        const cleanTitle = video.title
            .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .substring(0, 100) // Limit length
            .trim();
        
        // Get file extension from URL
        const urlParts = video.videoFile.split('.');
        const extension = urlParts[urlParts.length - 1].split('?')[0] || 'mp4';
        const filename = `${cleanTitle}.${extension}`;

        // Return the download URL to frontend
        return res
            .status(200)
            .json(
                new ApiResponse(200, {
                    downloadUrl: downloadUrl,
                    filename: filename,
                    originalUrl: video.videoFile
                }, "Download URL generated successfully")
            );

    } catch (error) {
        console.error('Download URL generation error:', error);
        throw new ApiError(500, "Failed to generate download URL");
    }
});

// Get download info (file size, type, etc.) - Simplified version
const getDownloadInfo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (!video.isPublished) {
        if (!req.user || req.user._id.toString() !== video.owner.toString()) {
            throw new ApiError(403, "Video is not publicly available");
        }
    }

    if (!video.videoFile) {
        throw new ApiError(400, "Video file not available");
    }

    try {
        // Generate download URL
        const downloadUrl = video.videoFile.replace("/upload/", "/upload/fl_attachment/");
        
        const fileInfo = {
            downloadUrl: downloadUrl,
            originalUrl: video.videoFile,
            filename: video.title.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '_').substring(0, 100) + '.mp4',
            title: video.title,
            duration: video.duration,
            views: video.views
        };

        res.status(200).json(
            new ApiResponse(200, fileInfo, "Download info retrieved successfully")
        );

    } catch (error) {
        console.error('Get download info error:', error);
        throw new ApiError(500, "Failed to get download info");
    }
});


export {getAllVideos,publishVideo,getVideoById,updateVideo,deleteVideo,togglePublishStatus,incrementVideoViews,getVideoStats,downloadVideo,getDownloadInfo
    ,getTrendingVideos
}

