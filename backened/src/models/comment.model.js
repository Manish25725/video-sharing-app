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
        ref:"User",
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

// Virtual for getting replies from Reply collection
commentSchema.virtual('replies', {
    ref: 'Reply',
    localField: '_id',
    foreignField: 'comment'
});

// Ensure virtual fields are serialized
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

// Index for better query performance
commentSchema.index({ video: 1 });
commentSchema.index({ tweet: 1 });
commentSchema.index({ owner: 1 });
commentSchema.index({ createdAt: -1 });

// Simple validation: Comment must belong to either video or tweet
commentSchema.pre('save', function(next) {
    if (this.video && this.tweet) {
        next(new Error('Comment cannot belong to both video and tweet'));
    }
    if (!this.video && !this.tweet) {
        next(new Error('Comment must belong to either video or tweet'));
    }
    next();
});

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment=mongoose.model("Comment",commentSchema)