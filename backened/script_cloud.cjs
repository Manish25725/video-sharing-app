const fs = require('fs');
let content = fs.readFileSync('src/utils/cloudinary.js', 'utf8');

// We use upload_large to support videos over 100MB without crashing.
content = content.replace(
  /const response=await cloudinary\.uploader\.upload\(localFilePath,\{resource_type:"auto"\}\);/g,
  const response = await cloudinary.uploader.upload_large(localFilePath, { resource_type: "auto", chunk_size: 20000000 });
);

content = content.replace(
  /catch\(error\)\{\s*console\.log\("Cloudinary upload error:", error\);\s*\/\/ Check if file exists before trying to delete it on error\s*if\(localFilePath && fs\.existsSync\(localFilePath\)\) \{\s*try \{\s*fs\.unlinkSync\(localFilePath\);\s*console\.log\("Temporary file deleted after error:", localFilePath\);\s*\} catch \(deleteError\) \{\s*console\.log\("Error deleting temporary file:", deleteError\);\s*\}\s*\}\s*return null;\s*\}/g,
  catch(error){
        console.log("Cloudinary upload error:", error);
        // Only delete file on error if it is from temp folder (multer upload)
        if(localFilePath && fs.existsSync(localFilePath) && !localFilePath.includes('recordings')) {
            try {
                fs.unlinkSync(localFilePath);
                console.log("Temporary file deleted after error:", localFilePath);
            } catch (deleteError) {
                console.log("Error deleting temporary file:", deleteError);
            }
        }
        return null;
    }
);

fs.writeFileSync('src/utils/cloudinary.js', content);
