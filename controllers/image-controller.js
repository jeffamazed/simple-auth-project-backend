const Image = require("../models/Image");
const { uploadToCloudinary } = require("../helpers/cloudinary-helper");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

const uploadImageController = async (req, res) => {
  try {
    // check if file is missing in req obj
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required. Please upload an image.",
      });
    }

    // upload to cloudinary
    const { url, publicId } = await uploadToCloudinary(req.file.path);

    // store into db
    const newUploadedImage = await Image.create({
      url,
      publicId,
      uploadedBy: req.userInfo.userId,
    });

    // delete the file from local storage
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Failed to delete local file", err);
    });

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully!",
      image: newUploadedImage,
    });
  } catch (error) {
    handleError(error, res);
  }
};

const fetchImagesController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 2;
    const skip = (page - 1) * limit;

    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = !req.query.sortOrder
      ? 1
      : req.query.sortOrder === "asc"
      ? 1
      : -1;
    const totalImages = await Image.countDocuments();
    const totalPages = Math.ceil(totalImages / limit);

    const sortObj = {};
    sortObj[sortBy] = sortOrder;
    const images = await Image.find().sort(sortObj).skip(skip).limit(limit);

    if (images.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No images found.",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages,
      totalImages,
      data: images,
    });
  } catch (error) {
    handleError(error, res);
  }
};

const deleteImageController = async (req, res) => {
  try {
    const imageIDToDelete = req.params.id;
    const userId = req.userInfo.userId;

    const image = await Image.findById(imageIDToDelete);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found.",
      });
    }

    // check if this image is uploaded by user trying to delete
    if (image.uploadedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this image.",
      });
    }

    // delete this image first from cloudinary storage
    const { result } = await cloudinary.uploader.destroy(image.publicId);
    if (result !== "ok") {
      throw new Error(`Cloudinary deletion failed: ${result}`);
    }

    // delete image from db
    await Image.findByIdAndDelete(imageIDToDelete);

    res.status(200).json({
      sucess: true,
      message: "Image deleted successfully!",
    });
  } catch (error) {
    handleError(error, res);
  }
};

function handleError(error, res) {
  console.error("Error occurred:", error);
  res.status(500).json({
    success: false,
    message: "Something went wrong! Please try again later.",
  });
}

module.exports = {
  uploadImageController,
  fetchImagesController,
  deleteImageController,
};
