const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Error while uploading to cloudinary", error);

    // re throw an error to bubble up
    throw new Error(`Error while uploading to cloudinary: ${error.message}`);
  }
};

module.exports = { uploadToCloudinary };
