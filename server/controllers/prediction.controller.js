const Prediction = require("../models/Prediction.model");
const mlSvc      = require("../services/ml.service");
const cloudSvc   = require("../services/cloudinary.service");
const { sendSuccess, sendError } = require("../utils/response.utils");

// POST /api/predict/image
const predictImage = async (req, res) => {
  if (!req.file) return sendError(res, 400, "No file uploaded");

  const user = req.user;
  const pred = await Prediction.create({ clerkId: user.clerkId, type: "image", status: "processing" });

  try {
    // 1. Upload original to Cloudinary
    const original = await cloudSvc.uploadBuffer(req.file.buffer, "emotion/originals", "image");
    pred.originalUrl      = original.url;
    pred.originalPublicId = original.publicId;

    // 2. Call ML service
    const useFace  = req.body.use_face_detection !== "false";
    const mlResult = await mlSvc.predictImage(req.file.buffer, req.file.originalname, useFace);

    // Log what Flask returned so we can debug key names
    console.log("Flask response keys:", Object.keys(mlResult));

    // 3. Upload annotated image
    // Flask returns "annotated_image_b64" — support both key names just in case
    const annotatedB64 = mlResult.annotated_image_b64 || mlResult.annotated_image_base64 || null;
    let annotatedUrl = null, annotatedPublicId = null;

    if (annotatedB64) {
      const ann     = await cloudSvc.uploadBase64(annotatedB64, "emotion/annotated");
      annotatedUrl      = ann.url;
      annotatedPublicId = ann.publicId;
      console.log("Annotated image uploaded:", annotatedUrl);
    } else {
      console.warn("No annotated image in Flask response!");
    }

    // 4. Save result
    pred.annotatedUrl      = annotatedUrl;
    pred.annotatedPublicId = annotatedPublicId;
    pred.result = {
      num_faces:  mlResult.num_faces  || 0,
      faces:      mlResult.faces      || [],
      summary:    mlResult.summary    || {},
      latency_ms: mlResult.latency_ms || 0,
    };
    pred.status = "done";
    await pred.save();

    // 5. Increment usage
    user.predictionsThisMonth += 1;
    await user.save();

    return sendSuccess(res, 201, "Image prediction complete", {
      predictionId: pred._id,
      originalUrl:  pred.originalUrl,
      annotatedUrl: pred.annotatedUrl,
      num_faces:    pred.result.num_faces,
      faces:        pred.result.faces,
      summary:      pred.result.summary,
      latency_ms:   pred.result.latency_ms,
    });
  } catch (err) {
    console.error("Prediction error:", err);
    pred.status       = "failed";
    pred.errorMessage = err.message;
    await pred.save();
    return sendError(res, 500, "Prediction failed: " + err.message);
  }
};

// POST /api/predict/video
const predictVideo = async (req, res) => {
  if (!req.file) return sendError(res, 400, "No file uploaded");

  const user = req.user;
  const pred = await Prediction.create({ clerkId: user.clerkId, type: "video", status: "processing" });

  try {
    const original = await cloudSvc.uploadBuffer(req.file.buffer, "emotion/originals", "video");
    pred.originalUrl      = original.url;
    pred.originalPublicId = original.publicId;

    const options = {
      frameSkip: parseInt(req.body.frame_skip) || 6,
      maxFrames:  parseInt(req.body.max_frames) || 150,
      saveVideo:  req.body.save_video !== "false",
    };

    const mlResult = await mlSvc.predictVideo(req.file.buffer, req.file.originalname, options);

    let annotatedUrl = null, annotatedPublicId = null;
    if (mlResult.annotated_video_url) {
      const videoBuf    = await mlSvc.downloadAnnotatedVideo(mlResult.annotated_video_url);
      const ann         = await cloudSvc.uploadBuffer(videoBuf, "emotion/annotated", "video");
      annotatedUrl      = ann.url;
      annotatedPublicId = ann.publicId;
    }

    pred.annotatedUrl      = annotatedUrl;
    pred.annotatedPublicId = annotatedPublicId;
    pred.result = {
      num_faces:        mlResult.num_faces        || 0,
      faces:            mlResult.faces            || [],
      summary:          mlResult.summary          || {},
      frames_processed: mlResult.frames_processed || 0,
      timeline:         mlResult.timeline         || [],
      video_meta:       mlResult.video_meta       || {},
      latency_ms:       mlResult.latency_ms       || 0,
    };
    pred.status = "done";
    await pred.save();

    user.predictionsThisMonth += 1;
    await user.save();

    return sendSuccess(res, 201, "Video prediction complete", {
      predictionId:     pred._id,
      originalUrl:      pred.originalUrl,
      annotatedUrl:     pred.annotatedUrl,
      num_faces:        pred.result.num_faces,
      summary:          pred.result.summary,
      frames_processed: pred.result.frames_processed,
      timeline:         pred.result.timeline,
      video_meta:       pred.result.video_meta,
      latency_ms:       pred.result.latency_ms,
    });
  } catch (err) {
    pred.status       = "failed";
    pred.errorMessage = err.message;
    await pred.save();
    return sendError(res, 500, "Video prediction failed: " + err.message);
  }
};

// GET /api/predict/history
const getHistory = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type  = req.query.type;

    const filter = { clerkId: req.user.clerkId };
    if (type === "image" || type === "video") filter.type = type;

    const total       = await Prediction.countDocuments(filter);
    const predictions = await Prediction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return sendSuccess(res, 200, "History fetched", {
      predictions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// GET /api/predict/:id
const getPrediction = async (req, res) => {
  try {
    const pred = await Prediction.findOne({ _id: req.params.id, clerkId: req.user.clerkId });
    if (!pred) return sendError(res, 404, "Prediction not found");
    return sendSuccess(res, 200, "OK", { prediction: pred });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

// DELETE /api/predict/:id
const deletePrediction = async (req, res) => {
  try {
    const pred = await Prediction.findOne({ _id: req.params.id, clerkId: req.user.clerkId });
    if (!pred) return sendError(res, 404, "Prediction not found");

    const rt = pred.type === "video" ? "video" : "image";
    if (pred.originalPublicId)  await cloudSvc.deleteFile(pred.originalPublicId, rt).catch(() => {});
    if (pred.annotatedPublicId) await cloudSvc.deleteFile(pred.annotatedPublicId, rt).catch(() => {});
    await pred.deleteOne();

    return sendSuccess(res, 200, "Prediction deleted");
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = { predictImage, predictVideo, getHistory, getPrediction, deletePrediction };