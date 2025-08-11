const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const adminMiddleware = require("../middleware/admin-middleware");
const uploadSingleImage = require("../middleware/upload-middleware");
const {
  uploadImageController,
  fetchImagesController,
  deleteImageController,
} = require("../controllers/image-controller");

const router = express.Router();

// upload image
router.post(
  "/upload",
  authMiddleware,
  adminMiddleware,
  uploadSingleImage,
  uploadImageController
);

// get all images
router.get("/get", authMiddleware, fetchImagesController);

// delete image
router.delete("/:id", authMiddleware, adminMiddleware, deleteImageController);

module.exports = router;
