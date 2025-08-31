import mongoose,{Schema} from "mongoose";

const commentSchema=new Schema({
    content:{
        type:String,
        required:true
    },

    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Users"
    },

    video:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    },
},{
    timestamps:true
})


export const Comment=mongoose.model("Comment",commentSchema)