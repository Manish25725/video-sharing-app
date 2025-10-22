import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const replySchema = new Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Reference to the parent comment (for top-level replies)
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    },

    // Reference to parent reply (for nested replies)
    parentReply: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reply",
        default: null
    },

    // Reference to video (inherited from parent comment)
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },

    // Reference to tweet (inherited from parent comment)
    tweet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tweet"
    },

    // Track nesting level for UI purposes
    level: {
        type: Number,
        default: 1, // 1 = reply to comment, 2 = reply to reply, etc.
        max: 5 // Limit nesting to prevent infinite threads
    },

    // Engagement tracking
    totalLikes: {
        type: Number,
        default: 0
    },

    totalDislikes: {
        type: Number,
        default: 0
    },

    totalReplies: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for better query performance
replySchema.index({ comment: 1 });
replySchema.index({ parentReply: 1 });
replySchema.index({ video: 1 });
replySchema.index({ tweet: 1 });
replySchema.index({ owner: 1 });
replySchema.index({ createdAt: -1 });

// Validation: Reply must have either comment or parentReply, but not both
replySchema.pre('save', function(next) {
    if (this.comment && this.parentReply) {
        next(new Error('Reply cannot have both comment and parentReply'));
    }
    if (!this.comment && !this.parentReply) {
        next(new Error('Reply must have either comment or parentReply'));
    }
    
    // Set level based on parent
    if (this.parentReply && this.isNew) {
        // This will be set in the controller after checking parent level
    } else if (this.comment) {
        this.level = 1; // Direct reply to comment
    }
    
    next();
});

// Middleware to update reply count when a reply is added
replySchema.post('save', async function() {
    if (this.isNew) {
        if (this.comment) {
            // Reply to comment - update comment's totalReplies
            const Comment = mongoose.model('Comment');
            await Comment.findByIdAndUpdate(
                this.comment,
                { $inc: { totalReplies: 1 } }
            );
        } else if (this.parentReply) {
            // Reply to reply - update parent reply's totalReplies
            await this.constructor.findByIdAndUpdate(
                this.parentReply,
                { $inc: { totalReplies: 1 } }
            );
        }
    }
});

// Middleware to update reply count when a reply is removed
replySchema.post('findOneAndDelete', async function(doc) {
    if (doc) {
        if (doc.comment) {
            const Comment = mongoose.model('Comment');
            await Comment.findByIdAndUpdate(
                doc.comment,
                { $inc: { totalReplies: -1 } }
            );
        } else if (doc.parentReply) {
            await this.model.findByIdAndUpdate(
                doc.parentReply,
                { $inc: { totalReplies: -1 } }
            );
        }
    }
});

replySchema.plugin(mongooseAggregatePaginate);

export const Reply = mongoose.model("Reply", replySchema);
