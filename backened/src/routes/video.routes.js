import {Router} from  "express"
import {upload} from "../middlewares/multer.middleware.js"

import { verifyJWT } from "../middlewares/auth.middleware.js"
import { videoFilter } from "../middlewares/viedeoFilter.middleware.js";
import { imageFilter } from "../middlewares/imageFilter.middleware.js";
import { getAllVideos,  publishVideo,getVideoById, updateVideo, deleteVideo, togglePublishStatus, incrementVideoViews, getVideoStats, downloadVideo, getDownloadInfo,getTrendingVideos} from "../controllers/video.controller.js";



const router=Router();

// Support both GET and POST for getAllVideos
router.route("/get-all-videos").post(verifyJWT, getAllVideos);
router.route("/get-all-videos").get(verifyJWT, getAllVideos);


router.route("/publish-video").post(verifyJWT,upload.fields([
    {
        name:"video",
        maxCount:1
    },{
        name:"thumbnail",
        maxCount:1
    }
]),publishVideo)

router.route("/getvideo/:videoId").get(verifyJWT,getVideoById)
router.route("/update-video-details/:videoId").patch(verifyJWT,upload.single("thumbnail"),updateVideo)


router.route("/delete-video/:videoId").delete(verifyJWT,deleteVideo);

router.route("/toggle-status/:videoId").patch(verifyJWT,togglePublishStatus);

router.route("/increment-views/:videoId").patch(incrementVideoViews);

router.route("/video-stats/:videoId").get(verifyJWT, getVideoStats);

// Download routes
router.route("/download/:videoId").get(verifyJWT, downloadVideo);
router.route("/download-info/:videoId").get(verifyJWT, getDownloadInfo);

router.route("/get-trending-videos").get(verifyJWT,getTrendingVideos);
export default router


