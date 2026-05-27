const express = require("express");
const router  = express.Router();
const { protect }              = require("../middleware/auth.middleware");
const { checkPredictionLimit, checkVideoAllowed } = require("../middleware/plan.middleware");
const { uploadImage, uploadVideo }                = require("../middleware/upload.middleware");
const {
  predictImage, predictVideo,
  getHistory, getPrediction, deletePrediction,
} = require("../controllers/prediction.controller");

router.post("/image",   ...protect, checkPredictionLimit, uploadImage,  predictImage);
router.post("/video",   ...protect, checkPredictionLimit, checkVideoAllowed, uploadVideo, predictVideo);
router.get("/history",  ...protect, getHistory);
router.get("/:id",      ...protect, getPrediction);
router.delete("/:id",   ...protect, deletePrediction);

module.exports = router;