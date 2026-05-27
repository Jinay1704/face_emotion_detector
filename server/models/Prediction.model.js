const mongoose = require("mongoose");

const FaceResultSchema = new mongoose.Schema(
  {
    face_id:    Number,
    bbox:       [Number],
    emotion:    String,
    confidence: Number,
    emoji:      String,
    all_preds:  [{ emotion: String, probability: Number }],
  },
  { _id: false }
);

const PredictionSchema = new mongoose.Schema(
  {
    // Reference by clerkId — no ObjectId join needed
    clerkId: { type: String, required: true, index: true },

    type: { type: String, enum: ["image", "video"], required: true },

    // Cloudinary
    originalUrl:       { type: String, default: null },
    annotatedUrl:      { type: String, default: null },
    originalPublicId:  { type: String, default: null },
    annotatedPublicId: { type: String, default: null },

    // ML result
    result: {
      num_faces:        { type: Number, default: 0 },
      faces:            [FaceResultSchema],
      summary:          { type: mongoose.Schema.Types.Mixed },
      frames_processed: { type: Number, default: null },
      timeline:         { type: mongoose.Schema.Types.Mixed, default: null },
      video_meta:       { type: mongoose.Schema.Types.Mixed, default: null },
      latency_ms:       Number,
    },

    status: {
      type:    String,
      enum:    ["processing", "done", "failed"],
      default: "processing",
    },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

PredictionSchema.index({ clerkId: 1, createdAt: -1 });

module.exports = mongoose.model("Prediction", PredictionSchema);