import {v2 as cloudinary} from "cloudinary"
import fs from "fs";

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) =>{

    try{
        if(!localFilePath) {
            console.log("No local file path provided to Cloudinary upload");
            return null;
        }
        
        console.log("Attempting to upload file to Cloudinary:", localFilePath);
        
        // Check if file exists before upload
        if(!fs.existsSync(localFilePath)) {
            console.log("File does not exist at path:", localFilePath);
            return null;
        }
        
        const response=await cloudinary.uploader.upload(localFilePath,{resource_type:"auto"});
        console.log("Cloudinary upload successful:", response.url);
        
        // Check if file exists before trying to delete it
        if(fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
            console.log("Temporary file deleted:", localFilePath);
        }
        return response;
    }

    catch(error){
        console.log("Cloudinary upload error:", error);
        // Check if file exists before trying to delete it on error
        if(localFilePath && fs.existsSync(localFilePath)) {
            try {
                fs.unlinkSync(localFilePath);
                console.log("Temporary file deleted after error:", localFilePath);
            } catch (deleteError) {
                console.log("Error deleting temporary file:", deleteError);
            }
        }
        return null;
    }
}

const extractPublicId = (url) => {
    try {
        const uploadIndex = url.indexOf('/upload/');
        if (uploadIndex === -1) return url;
        let path = url.slice(uploadIndex + 8);   // after '/upload/'
        path = path.replace(/^v\d+\//, '');       // strip version prefix e.g. v1234567/
        return path.replace(/\.[^/.]+$/, '');     // strip file extension
    } catch {
        return url;
    }
};

const deleteOnCloudinary = async (url) => {
    if (!url) return;
    try {
        const publicId = extractPublicId(url);
        const response = await cloudinary.uploader.destroy(publicId);
        return response;
    } catch (error) {
        console.error("Cloudinary deletion error:", error.message);
    }
};

export {uploadOnCloudinary,deleteOnCloudinary};
