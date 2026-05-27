const multer = require("multer");
const path   = require("path");
const { PLAN_LIMITS } = require("./plan.middleware");

const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png", ".webp"];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, WEBP allowed"), false);
  }
};

const videoFilter = (req, file, cb) => {
  const allowed = [".mp4", ".avi", ".mov", ".mkv"];
  if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error("Only MP4, AVI, MOV, MKV allowed"), false);
  }
};

const getSizeLimit = (req) => {
  const plan = req.user ? req.user.plan : "free";
  return (PLAN_LIMITS[plan] || PLAN_LIMITS.free).maxFileSizeMB * 1024 * 1024;
};

const uploadImage = (req, res, next) => {
  multer({ storage, fileFilter: imageFilter, limits: { fileSize: getSizeLimit(req) } })
    .single("file")(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message });
      next();
    });
};

const uploadVideo = (req, res, next) => {
  multer({ storage, fileFilter: videoFilter, limits: { fileSize: getSizeLimit(req) } })
    .single("file")(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message });
      next();
    });
};

module.exports = { uploadImage, uploadVideo };