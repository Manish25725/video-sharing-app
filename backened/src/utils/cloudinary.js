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
            return null;
        }
        
        
        // Check if file exists before upload
        if(!fs.existsSync(localFilePath)) {
            return null;
        }
        
        const response = await cloudinary.uploader.upload_large(localFilePath, { resource_type: "auto", chunk_size: 20000000 });

        // Check if file exists before trying to delete it
        if(fs.existsSync(localFilePath) && !localFilePath.includes('recordings')) {
            fs.unlinkSync(localFilePath);
        }
        return response;
    }

    catch(error){
        // Check if file exists before trying to delete it on error
        // Important: never delete stream video recordings on error so we can retry!
        if(localFilePath && fs.existsSync(localFilePath) && !localFilePath.includes('recordings')) {
            try {
                fs.unlinkSync(localFilePath);
            } catch (deleteError) {
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

const uploadSubtitleToCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        if (!fs.existsSync(localFilePath)) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "raw",
            format: "vtt",
        });

        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        if (localFilePath && fs.existsSync(localFilePath)) {
            try { fs.unlinkSync(localFilePath); } catch {}
        }
        return null;
    }
};

export {uploadOnCloudinary, deleteOnCloudinary, uploadSubtitleToCloudinary};
