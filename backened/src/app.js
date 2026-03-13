import express from 'express'
import cors from "cors"
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import userRouter from './routes/user.routes.js'
import videoRouter from "./routes/video.routes.js"
import subscriptionRouter from "./routes/subscription.route.js"
import commentRouter from "./routes/comment.route.js"
import tweetRouter from "./routes/tweet.route.js"
import likeRouter from "./routes/like.route.js"
import playlistRouter from "./routes/playlist.route.js"
import dashboardRouter from "./routes/dashboard.route.js"
import notificationRouter from "./routes/notification.route.js"
import dislikeRouter from "./routes/dislike.route.js"
import healthRouter from "./routes/health.route.js"
import streamRouter from './routes/stream.route.js'
import reportRouter from './routes/report.route.js'
import feedbackRouter from './routes/feedback.route.js'
import adminRouter from './routes/admin.routes.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app=express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
    "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:5173")
    .split(",").map(o => o.trim());

app.use(cors({
    origin: allowedOrigins,
    credentials:true 
}));

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

// Serve HLS segments through Express so CORS headers are applied
app.use("/live", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
}, express.static(path.join(__dirname, "../public/media/live")));

app.use("/api/v1/users",userRouter);
app.use("/api/v1/videos",videoRouter);
app.use("/api/v1/subscription",subscriptionRouter)
app.use("/api/v1/comment",commentRouter)
app.use("/api/v1/tweets",tweetRouter)
app.use("/api/v1/like",likeRouter)
app.use("/api/v1/playlist",playlistRouter)
app.use("/api/v1/dashboard",dashboardRouter)
app.use("/api/v1/notifications",notificationRouter)
app.use("/api/v1/dislike",dislikeRouter)
app.use("/api/v1/health",healthRouter)
app.use("/api/v1/streams",streamRouter)
app.use("/api/v1/reports",reportRouter)
app.use("/api/v1/feedback",feedbackRouter)
app.use("/api/v1/admin", adminRouter)

// Global error handler - must be last middleware
// 1. Clean up any files multer wrote to disk before the error was thrown.
//    Both req.file (single) and req.files (multi-field object or array) are handled.
// 2. Serialize the error as JSON.
app.use((err, req, res, next) => {
    // Collect every multer-written file path and delete it
    const multerFiles = req.files
        ? Object.values(req.files).flat()   // { avatar: [..], coverImage: [..] } or [[..],[..]]
        : req.file
        ? [req.file]
        : [];

    for (const file of multerFiles) {
        try {
            if (file?.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        } catch { /* cleanup errors must never mask the real error */ }
    }

    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        success: false,
        statusCode,
        message: err.message || "Something went wrong",
        errors: err.errors || []
    });
});

export {app}
