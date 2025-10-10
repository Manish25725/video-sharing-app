import mongoose,{Schema} from "mongoose"


const replySchema = new Schema({
    comment :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Comment"
    },

    content:{
        type : String,
        required: true,
        trim: true
    },

    owner:{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required: true
    },

    tweet:{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Tweet"
    }
}, {
    timestamps: true
})



export const Reply=mongoose.model("Reply",replySchema)
