import mongoose,{Schema} from "mongoose"


const tweetSchema=new Schema({
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Users"
    },

    content:{
        type:String,
        required:true
    }
},{
    timestamps:true
})


export const Tweet= mongoose.model("Tweet",tweetSchema);