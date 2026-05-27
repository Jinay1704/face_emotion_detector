const fetch    = require("node-fetch");
const FormData = require("form-data");

const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

const predictImage = async (buffer, originalName, useFaceDetection) => {
  const form = new FormData();
  form.append("file", buffer, { filename: originalName || "upload.jpg", contentType: "image/jpeg" });
  form.append("use_face_detection", useFaceDetection !== false ? "true" : "false");

  const res = await fetch(ML_URL + "/predict/image", {
    method:  "POST",
    body:    form,
    headers: form.getHeaders(),
    timeout: 600000,   // 10 minutes — enough for model load + inference
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("ML error (" + res.status + "): " + text);
  }
  return res.json();
};

const predictVideo = async (buffer, originalName, options) => {
  const form = new FormData();
  form.append("file", buffer, { filename: originalName || "upload.mp4", contentType: "video/mp4" });
  form.append("frame_skip", String(options.frameSkip || 6));
  form.append("max_frames",  String(options.maxFrames || 150));
  form.append("save_video",  String(options.saveVideo !== false ? "true" : "false"));

  const res = await fetch(ML_URL + "/predict/video", {
    method:  "POST",
    body:    form,
    headers: form.getHeaders(),
    timeout: 300000,   // 5 minutes for video
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("ML error (" + res.status + "): " + text);
  }
  return res.json();
};

const downloadAnnotatedVideo = async (videoUrlPath) => {
  const res = await fetch(ML_URL + videoUrlPath, { timeout: 60000 });
  if (!res.ok) throw new Error("Could not download annotated video");
  return res.buffer();
};

module.exports = { predictImage, predictVideo, downloadAnnotatedVideo };