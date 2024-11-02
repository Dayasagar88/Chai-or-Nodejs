import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({ 
  cloud_name : process.env.CLOUDINARY_CLOUD_NAME, 
  api_key : process.env.CLOUDINARY_API_KEY, 
  api_secret : process.env.CLOUDINARY_API_SECRET 
});




const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const res = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    //File has been uploaded successfully
    // console.log("File upload successfully", res);
    fs.unlinkSync(localFilePath);
    return res;
  } catch (error) {
    // console.log(error)
    fs.unlinkSync(localFilePath); //Remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

export { uploadOnCloudinary };
