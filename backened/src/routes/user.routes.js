import {Router} from "express"
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, getWatchLater, getWatchLaterIds, addToWatchLater, removeFromWatchLater, loginUser, logoutUser, registerUser, updateDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshAccessToken } from "../controllers/user.controller.js";
const router=Router();


router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
    )


router.route("/login").post(loginUser);
//Secured routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT,changeCurrentPassword);

router.route("/current-user").get(verifyJWT,getCurrentUser);

router.route("/update-account").patch(verifyJWT,updateDetails);

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)

router.route("/cover-Image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

router.route("/c/:userName").get(verifyJWT,getUserChannelProfile)

router.route("/history").get(verifyJWT,getWatchHistory)

router.route("/watch-later").get(verifyJWT,getWatchLater)

router.route("/watch-later-ids").get(verifyJWT,getWatchLaterIds)

router.route("/watch-later/:videoId").post(verifyJWT,addToWatchLater)

router.route("/watch-later/:videoId").delete(verifyJWT,removeFromWatchLater)





export default router


