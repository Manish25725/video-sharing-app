import {v2 as cloudinary} from "cloudinary"
import fs from "fs";

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) =>{

    try{
        if(!localFilePath) return null;
        const response=await cloudinary.uploader.upload(localFilePath,{resource_type:"auto"});
        //file has been uploaded succesfully
        //console.log("file is uploaded on cloudinary",response.url);
        
        // Check if file exists before trying to delete it
        if(fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return response;
    }

    catch(error){
        // Check if file exists before trying to delete it
        if(fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.log("Cloudinary upload error:", error);
        return null;
    }
}

const deleteOnCloudinary=async(FilePath)=>{
    try {
        const response=await cloudinary.uploader.destroy(FilePath);
        console.log(response);
        return response;
        
    } catch (error) {
        console.log("Cloudinary deletion error",error.message);
    }
}

export {uploadOnCloudinary,deleteOnCloudinary};
