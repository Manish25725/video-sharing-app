import { Router } from "express";
import { toggleVideoDislike } from "../controllers/dislike.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

router.route("/toggle-video-dislike/:videoId").get(verifyJWT,toggleVideoDislike);

export default router