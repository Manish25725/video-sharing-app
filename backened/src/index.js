//require('dotenv').config({path:"./env"});
import { createServer } from 'http'
import { Server } from 'socket.io'
import { createAdapter } from "@socket.io/redis-adapter"
import connectDB from './db/index.js'
import {app} from './app.js'
import { nms } from './liveServer.js'
import { pub, sub } from './lib/redis.js'
import { registerSocketHandlers } from './live/socketHandlers.js'
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

// Attach Redis adapter — propagates room broadcasts across all Node.js instances.
// Falls back to single-server (in-memory) mode if Redis is not reachable.
try {
    io.adapter(createAdapter(pub, sub))
    console.log("[socket.io] Redis adapter attached")
} catch (err) {
    console.warn("[socket.io] Redis adapter skipped — running in single-server mode:", err.message)
}

// Make io available globally for other modules
global.io = io

connectDB()
.then(()=>{
    const PORT = process.env.PORT || 8000;

    // Register all live streaming + chat socket handlers (Redis-backed)
    registerSocketHandlers(io)
    
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