import {mongoose,Schema} from "mongoose"

const notificationSchema = new Schema({
    // User who will receive the notification
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    
    // User who triggered the notification
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    
    // Type of notification
    type: {
        type: String,
        enum: [
            'video_upload',
            'tweet_post'
        ],
        required: true
    },
    
    // Reference to the related content
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
    
    tweet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tweet"
    },
    
    // Notification message
    message: {
        type: String,
        required: true
    },
    
    // Whether the notification has been read
    isRead: {
        type: Boolean,
        default: false
    },
    
    // Whether the notification was sent via socket
    isSent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

export const Notification = mongoose.model("Notification", notificationSchema);