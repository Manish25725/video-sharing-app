import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import {Playlist} from "../models/playlist.model.js"
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if(!req.user){
        throw new ApiError(401,"user must be logged in")
    }

    const asd=await Playlist.create({
        name:name,
        description:description,
        video:[],
        owner:req.user._id
    })

    if(!asd){
        throw new ApiError(400,"Error while creating a playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,asd,"Playlist created successfully")
    )
})


const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!req.user){
        throw new ApiError(401,"user must be logged in ")
    }

    const re=await Playlist.find({owner:userId})

    if(!re){
        throw new ApiError(400,"Error while fetching a playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,re,"Playlists fetched successfully"))
})


const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!req.user){
        throw new ApiError(401,"user must be logged in")
    }

    const re=await Playlist.findById(playlistId)
    if(!re){
        throw new ApiError(400,"Playlist not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,re,"Playlist fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!req.user){
        throw new ApiError(401,"user should be logged in")
    }

    const playlist=await Playlist.findById(playlistId);

    //console.log(playlist)

    if(!playlist){
        throw new ApiError(400,"Playlist not found")
    }

    if(!playlist.videos.includes(videoId)){
        playlist.videos.push(videoId)
        await playlist.save()
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Video added to playlist succesfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!req.user){
        throw new ApiError(401,"user must be logged in")
    }

    const playlist=await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400,"No such playlist")
    }

    //console.log(playlist)

    if(playlist.videos.some(id => id.toString() === videoId)){
        playlist.videos.pull(videoId)
        await playlist.save()
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Video removed successfully from playlist")
    )
})


const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!req.user){
        throw new ApiError(401,"user must be logged in")
    }

    const re=await Playlist.findByIdAndDelete(playlistId)

    if(!re){
        throw new ApiError(400,"No such playlist exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,re,"Playlist deleted successfully")
    )

})


const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!req.user){
        throw new ApiError(401,"user must be logged in")
    }

     if (!name && !description) {
        throw new ApiError(400, "Nothing to update");
    }

    let data={}
    if(name) data.name=name
    if(description) data.description=description


    
    const re=await Playlist.findOneAndUpdate(
        {
            _id:playlistId,
            owner:req.user._id
        },
        {
            $set:data
        },{
            new :true
        }
    )

    if(!re){
        throw new ApiError(400,"Playlist does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,re,"Playlist details updates successfully")
    )
})


export {
    createPlaylist,
    getPlaylistById,
    getUserPlaylists,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}