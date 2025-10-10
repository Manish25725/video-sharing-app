//require('dotenv').config({path:"./env"});
import { createServer } from 'http'
import { Server } from 'socket.io'
import connectDB from './db/index.js'
import {app} from './app.js'
import dotenv from "dotenv"

dotenv.config({
    path:"./.env"
})

// Create HTTP server and Socket.io instance
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:5173"],
        credentials: true
    }
})

// Make io available globally for other modules
global.io = io

connectDB()
.then(()=>{
    const PORT = process.env.PORT || 8004;
    
    // Socket.io connection handling
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id)
        
        // Handle user joining their personal notification room
        socket.on('join-user', (userId) => {
            socket.join(`user:${userId}`)
            console.log(`User ${userId} joined their notification room`)
        })
        
        // Handle user joining video room for real-time interactions
        socket.on('join-video', (videoId) => {
            socket.join(`video:${videoId}`)
            console.log(`User joined video room: ${videoId}`)
        })
        
        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id)
        })
    })
    
    server.listen(PORT)
    console.log(`Server is running at port ${PORT}`)
})
.catch((error)=>{
    console.log("MONGODB connection failed!!!!", error);
    
})






/*

import express from "express";
const app=express();
(async ()=>{
    try{
        mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        app.on("error",(error)=>{
            console.log("Error: ",error);
            throw error;
        });

        app.listen(process.env.PORT,()=>{
            console.log(`app is listening on port ${process.env.PORT}`);
        })
    }
    catch(error){
        console.error("ERROR: ",error);
        throw error;
    }

})()

*/