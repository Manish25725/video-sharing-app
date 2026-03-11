import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new Schema(
    {
        videoFile: {
            type: String, //cloudinary url
            required: true
        },
        thumbnail: {
            type: String, //cloudinary url
            required: true
        },
        title: {
            type: String, 
            required: true
        },
        description: {
            type: String, 
            required: true
        },
        duration: {
            type: Number, 
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        
        videoType:{
            type:String,
            required:true,
        },

        isBlocked: {
            type: Boolean,
            default: false
        },
        blockedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        blockedAt: {
            type: Date
        },
        blockReason: {
            type: String
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        isDownload:{
            type:Boolean,
        },
        typeofVideo:{
            type:String,
        },
        // Set when this video was saved from a live stream recording
        streamKey: {
            type: String,
            default: null,
        },

        // Subtitle / caption tracks
        subtitles: [
            {
                label:    { type: String, required: true },  // e.g. "English"
                language: { type: String, required: true },  // BCP-47, e.g. "en"
                url:      { type: String, required: true },  // Cloudinary raw URL (.vtt)
            }
        ],
    },
    {
        timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)