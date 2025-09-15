import { mongoose,Schema } from "mongoose";


const dislikeSchema=new Schema({
    comment:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Comment"
    },

    video:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    },
    
    tweet:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Tweet"
    },

    dislikedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }

},{timestamps:true})


export const Dislike=new mongoose.model("Dislike",dislikeSchema);