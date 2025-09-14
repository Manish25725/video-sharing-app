import {Router} from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, getCreatorPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";


const router=Router();

router.route("/create-playlist").post(verifyJWT,createPlaylist)
router.route("/get-user-playlists/:userId").get(verifyJWT,getUserPlaylists)
router.route("/get-user-playlists").get(verifyJWT,getUserPlaylists) // For current user
router.route("/get-creator-playlists/:userId").get(verifyJWT,getCreatorPlaylists)
router.route("/get-creator-playlists").get(verifyJWT,getCreatorPlaylists) // For current user
router.route("/get-playlist/:playlistId").get(verifyJWT,getPlaylistById)
router.route("/add-video-to-playlist/:playlistId/:videoId").post(verifyJWT,addVideoToPlaylist)
router.route("/remove-video-playlist/:playlistId/:videoId").get(verifyJWT,removeVideoFromPlaylist)
router.route("/delete-playlist/:playlistId").delete(verifyJWT,deletePlaylist)
router.route("/update-playlist/:playlistId").patch(verifyJWT,updatePlaylist)


export default router
