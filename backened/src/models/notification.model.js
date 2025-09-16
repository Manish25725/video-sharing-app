import {mongoose,Schema} from "mongoose"


const notificationSchema=new Schema({
    recipient:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    sender:{
        type:"mongoose.Schema.Types.ObjectId",
        ref:"User"
    },

    read:{
        type:Boolean,
        default:false
    },
    video:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    }
    
},{timestamps:true})