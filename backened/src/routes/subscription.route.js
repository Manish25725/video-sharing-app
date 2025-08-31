import {Router} from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { getUserChannelSubscribers, toggleSubscription,getSubscribedChannels, checkSubscriptionStatus } from "../controllers/subscription.controller.js";


const router=Router();


router.route("/toggle-subscribe/:channelId").post(verifyJWT,toggleSubscription)

router.route("/check-subscription/:channelId").get(verifyJWT,checkSubscriptionStatus)

router.route("/get-user-channel-subscriber/:channelId").post(verifyJWT,getUserChannelSubscribers);

router.route("/get-channel/:subscriberId").get(verifyJWT,getSubscribedChannels);

export default router