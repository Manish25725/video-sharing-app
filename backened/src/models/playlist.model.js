import mongoose,{Schema} from "mongoose";


const playlistSchema=new Schema({
    name:{
        type:String,
        required:true
    },

    description:{
        type:String,
        required:false,
        default: ""
    },

    videos:[
        {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    }
    ],

    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    type: {
        type: String,
        enum: ["creator", "user"],  // creator → grouped uploads, user → personal
        default: "user"
    },

    isPrivate: {
        type: Boolean,
        default: false
    }


},{
    timestamps:true
}
)

export const Playlist=mongoose.model("Playlist",playlistSchema)
