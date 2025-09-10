import mongoose,{Schema} from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        userName:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            required:true,
            lowercase:true,
            trim:true
        },
        fullName:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String,
            required:true
        },
        coverImage:{
            type:String,
            required:true
        },
        watchHistory:[
            {
            videoDetail:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Video",
                requrired:true
            },

            watchedAt:{
                type:Date,
                default:Date.now()
            }
        }
        ],
        password:{
            type:String,
            required:[true,"password is required"]
        },
        role:{
            type:String,
            enum:["user","admin"],
            default:"user"
        },
        preferences:{
            darkTheme:{
                type:Boolean,
                default:false
            }
        },
        refreshToken:{
            type:String
        },
        watchLater:[
            {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
            }
        ],
    },{
        timestamps:true
    }
);

userSchema.pre("save",async function (next){
        if (!this.isModified("password")) return next();
        this.password=await bcrypt.hash(this.password,10);
        next();
})


userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            userName:this.username,
            fullName:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User=mongoose.model("User",userSchema);
