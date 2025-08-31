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
        }
    }, 
    {
        timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)