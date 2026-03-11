//require('dotenv').config({path:"./env"});
import { createServer } from 'http'
import { Server } from 'socket.io'
import connectDB from './db/index.js'
import {app} from './app.js'
import { nms } from './liveServer.js'
import { Stream } from './models/stream.model.js'
import { Message } from './models/message.model.js'
import dotenv from "dotenv"
import "./workers/subtitleWorker.js"   // start background subtitle worker

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
    const PORT = process.env.PORT || 8000;
    
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
        
        // ── Live stream: join room ─────────────────────────────
        socket.on('join-stream', async ({ streamKey, userId, username }) => {
            if (!streamKey) return
            socket.join(`stream:${streamKey}`)
            socket._streamKey = streamKey

            // Track viewers in-memory
            if (!global.streamViewers) global.streamViewers = new Map()
            if (!global.streamViewers.has(streamKey)) {
                global.streamViewers.set(streamKey, new Set())
            }
            global.streamViewers.get(streamKey).add(socket.id)
            const count = global.streamViewers.get(streamKey).size

            try {
                await Stream.findOneAndUpdate({ streamKey }, { viewerCount: count })
            } catch {}
            io.to(`stream:${streamKey}`).emit('viewer-count', { count })
            console.log(`[Socket] Viewer joined stream ${streamKey} (total: ${count})`)
        })

        // ── Live stream: leave room ───────────────────────────
        socket.on('leave-stream', async ({ streamKey }) => {
            if (!streamKey) return
            socket.leave(`stream:${streamKey}`)
            socket._streamKey = null
            if (global.streamViewers?.has(streamKey)) {
                global.streamViewers.get(streamKey).delete(socket.id)
                const count = global.streamViewers.get(streamKey).size
                try {
                    await Stream.findOneAndUpdate({ streamKey }, { viewerCount: count })
                } catch {}
                io.to(`stream:${streamKey}`).emit('viewer-count', { count })
            }
        })

        // ── Live chat: send message ───────────────────────────
        socket.on('chat-message', async (data) => {
            const { streamKey, message, userId, username } = data || {}
            if (!streamKey || !message?.trim()) return

            // Basic sanitization: strip HTML tags
            const sanitized = message.trim().replace(/<[^>]*>/g, '').substring(0, 500)
            const safeUsername = (username || 'Viewer').replace(/<[^>]*>/g, '').substring(0, 60)

            try {
                const stream = await Stream.findOne({ streamKey })
                if (!stream) return

                const msg = await Message.create({
                    streamId: stream._id,
                    userId: userId || null,
                    username: safeUsername,
                    message: sanitized,
                })

                io.to(`stream:${streamKey}`).emit('chat-message', {
                    _id: msg._id,
                    username: msg.username,
                    message: msg.message,
                    createdAt: msg.createdAt,
                })
            } catch (err) {
                console.error('[Socket] Chat error:', err.message)
            }
        })

        // ── Handle disconnect: clean up viewer tracking ───────
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id)
            const streamKey = socket._streamKey
            if (streamKey && global.streamViewers?.has(streamKey)) {
                global.streamViewers.get(streamKey).delete(socket.id)
                const count = global.streamViewers.get(streamKey).size
                Stream.findOneAndUpdate({ streamKey }, { viewerCount: count })
                    .then(() => io.to(`stream:${streamKey}`).emit('viewer-count', { count }))
                    .catch(() => {})
            }
        })
    })
    
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Please free the port and restart.`);
            process.exit(1);
        } else {
            console.error('Server error:', error);
            process.exit(1);
        }
    });

    server.listen(PORT, () => {
        console.log(`Server is running at port ${PORT}`);
        // Start RTMP/HLS streaming server
        nms.run();
        console.log(`[NMS] RTMP server on port ${process.env.RTMP_PORT || 1935}`);
        console.log(`[NMS] HLS  server on port ${process.env.HLS_PORT  || 8001}`);
    });
})
.catch((error)=>{
    console.log("MONGODB connection failed!!!!", error);
    process.exit(1);
})