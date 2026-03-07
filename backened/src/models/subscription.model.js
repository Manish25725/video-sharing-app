import mongoose,{Schema} from "mongoose"


const subscriptionSchema=new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,//one who is subscribing ...
        ref:"User"
    },

    channel:{
        // one to whom 'subscirber' is subscribing...
        type:Schema.Types.ObjectId,
        ref:"User"
    },

    notificationsEnabled:{
        // Per-channel notification preference; true = notify on new uploads/posts
        type:Boolean,
        default:true
    }
},
{
    timestamps:true
})


export const  Subscription=mongoose.model("Subscription",subscriptionSchema);

