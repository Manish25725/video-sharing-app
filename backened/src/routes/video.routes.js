import {Router} from  "express"
import {upload} from "../middlewares/multer.middleware.js"

import { verifyJWT } from "../middlewares/auth.middleware.js"
import { videoFilter } from "../middlewares/viedeoFilter.middleware.js";
import { imageFilter } from "../middlewares/imageFilter.middleware.js";
import { getAllVideos,  publishVideo,getVideoById, updateVideo, deleteVideo, togglePublishStatus, incrementVideoViews, getVideoStats, downloadVideo, getDownloadInfo,getTrendingVideos} from "../controllers/video.controller.js";



const router=Router();

// Public routes - no authentication required for viewing videos
router.route("/get-all-videos").post(getAllVideos);
router.route("/get-all-videos").get(getAllVideos);

// Public route for getting individual video - anyone can view videos
router.route("/getvideo/:videoId").get(getVideoById)

// Public route for trending videos
router.route("/get-trending-videos").get(getTrendingVideos);

// Public route for incrementing views - no auth needed
router.route("/increment-views/:videoId").patch(incrementVideoViews);

// Protected routes - require authentication
router.route("/publish-video").post(verifyJWT,upload.fields([
    {
        name:"video",
        maxCount:1
    },{
        name:"thumbnail",
        maxCount:1
    }
]),publishVideo)
// Protected routes - require authentication for video management
router.route("/update-video-details/:videoId").patch(verifyJWT,upload.single("thumbnail"),updateVideo)
router.route("/delete-video/:videoId").delete(verifyJWT,deleteVideo);
router.route("/toggle-status/:videoId").patch(verifyJWT,togglePublishStatus);
router.route("/video-stats/:videoId").get(verifyJWT, getVideoStats);

// Download routes - require authentication
router.route("/download/:videoId").get(verifyJWT, downloadVideo);
router.route("/download-info/:videoId").get(verifyJWT, getDownloadInfo);
export default router


