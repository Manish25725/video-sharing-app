import {Router} from  "express"
import {upload} from "../middlewares/multer.middleware.js"

import { verifyJWT, optionalAuth } from "../middlewares/auth.middleware.js"
import { videoFilter } from "../middlewares/viedeoFilter.middleware.js";
import { imageFilter } from "../middlewares/imageFilter.middleware.js";
import { getAllVideos,  publishVideo,getVideoById, updateVideo, deleteVideo, togglePublishStatus, incrementVideoViews, getVideoStats, downloadVideo, getDownloadInfo} from "../controllers/video.controller.js";



const router=Router();

// Support both GET and POST for getAllVideos
router.route("/get-all-videos").post(optionalAuth, getAllVideos);
router.route("/get-all-videos").get(optionalAuth, getAllVideos);


router.route("/publish-video").post(verifyJWT,upload.fields([
    {
        name:"video",
        maxCount:1
    },{
        name:"thumbnail",
        maxCount:1
    }
]),publishVideo)

router.route("/getvideo/:videoId").get(optionalAuth,getVideoById)
router.route("/update-video-details/:videoId").patch(verifyJWT,upload.single("thumbnail"),updateVideo)


router.route("/delete-video/:videoId").delete(verifyJWT,deleteVideo);

router.route("/toggle-status/:videoId").patch(verifyJWT,togglePublishStatus);

router.route("/increment-views/:videoId").patch(incrementVideoViews);

router.route("/video-stats/:videoId").get(optionalAuth, getVideoStats);

// Download routes
router.route("/download/:videoId").get(optionalAuth, downloadVideo);
router.route("/download-info/:videoId").get(optionalAuth, getDownloadInfo);

export default router


