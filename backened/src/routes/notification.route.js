import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { videoUploadeNotify } from "../controllers/notification.controller.js";
const router=Router();


router.route('/video-upload-notify').post(verifyJWT,videoUploadeNotify)


export default router