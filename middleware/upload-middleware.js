const multer = require("multer");
const path = require("path");

// set multer storage
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "uploads/");
  },
  filename: (req, file, callback) => {
    callback(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// file filter function
const checkFileFilter = (req, file, callback) => {
  if (file.mimetype.startsWith("image")) {
    callback(null, true);
  } else {
    callback(new Error("This is not an image. Please upload only images."));
  }
};

// multer middleware
const upload = multer({
  storage: storage,
  fileFilter: checkFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
    // files: 1, // limit to one file
  },
});

const uploadSingleImage = (req, res, next) => {
  const singleImageMiddleware = upload.single("image");

  singleImageMiddleware(req, res, (err) => {
    if (
      err instanceof multer.MulterError &&
      err.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      console.error(err.name, err.message, err.code);
      return res.status(400).json({
        success: false,
        message: "Only one image is allowed.",
      });
    }

    if (err) return next(err);
    next();
  });
};

module.exports = uploadSingleImage;
