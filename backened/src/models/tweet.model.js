import mongoose,{Schema} from "mongoose"


const tweetSchema=new Schema({
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    content:{
        type:String
    },
    images:[{
        type:String   // cloudinary URLs
    }],
    poll:{
        question:{ type:String, default:"" },
        options:[{
            text:{ type:String },
            votes:[{ type:mongoose.Schema.Types.ObjectId, ref:"User" }]
        }],
        multipleChoice:{ type:Boolean, default:false },
        endsAt:{ type:Date }
    },
    commentsEnabled:{
        type:Boolean,
        default:true
    }
},{
    timestamps:true
})


export const Tweet= mongoose.model("Tweet",tweetSchema);