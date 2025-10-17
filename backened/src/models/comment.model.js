import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema=new Schema({
    content:{
        type:String,
        required:true,
        trim: true
    },

    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User", // Fixed: was "Users" (incorrect)
        required: true
    },

    video:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    },

    tweet:{
        type :mongoose.Schema.Types.ObjectId,
        ref : "Tweet"
    },

    // Reply functionality
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
        default: null // null means it's a top-level comment
    },

    isReply: {
        type: Boolean,
        default: false
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
},{
    timestamps:true
});

// Virtual for getting replies
commentSchema.virtual('replies', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'parentComment'
});

// Ensure virtual fields are serialized
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

// Index for better query performance
commentSchema.index({ video: 1, parentComment: 1 });
commentSchema.index({ tweet: 1, parentComment: 1 });
commentSchema.index({ owner: 1 });
commentSchema.index({ createdAt: -1 });

// Validation: Comment must belong to either video or tweet, but not both
commentSchema.pre('save', function(next) {
    if (this.video && this.tweet) {
        next(new Error('Comment cannot belong to both video and tweet'));
    }
    if (!this.video && !this.tweet && !this.parentComment) {
        next(new Error('Comment must belong to either video, tweet, or be a reply'));
    }
    
    // Set isReply based on parentComment
    this.isReply = !!this.parentComment;
    
    next();
});

// Middleware to update reply count when a reply is added
commentSchema.post('save', async function() {
    if (this.parentComment && this.isNew) {
        await this.constructor.findByIdAndUpdate(
            this.parentComment,
            { $inc: { totalReplies: 1 } }
        );
    }
});

// Middleware to update reply count when a reply is removed
commentSchema.post('findOneAndDelete', async function(doc) {
    if (doc && doc.parentComment) {
        await this.model.findByIdAndUpdate(
            doc.parentComment,
            { $inc: { totalReplies: -1 } }
        );
    }
});

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment=mongoose.model("Comment",commentSchema)