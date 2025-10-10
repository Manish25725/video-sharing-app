import mongoose,{Schema} from "mongoose"


const replySchema = new Schema({
    comment :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Comment"
    },

    content:{
        type : String
    },

    tweet:{
        type : mongoose.Schema.Types.ObjectId,
        ref : "tweet"
    }
})



export const Reply=mongoose.model("Reply",replySchema)
