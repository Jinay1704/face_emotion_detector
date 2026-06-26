require("dotenv").config();
const express     = require("express");
const cors        = require("cors");
const helmet      = require("helmet");
const morgan      = require("morgan");
const rateLimit   = require("express-rate-limit");
const { clerkMiddleware } = require("@clerk/express");

const app = express();


app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// ── CORS ───────────────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://face-emotion-detector-yqay.onrender.com"
  ],
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization"
  ]
}));

// ── Rate limiting ──────────────────────────────────────────────
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true }));

// ── Logging ────────────────────────────────────────────────────
app.use(morgan("dev")); // always log so Render logs show requests

// ── ⚠️  WEBHOOK ROUTE MUST BE BEFORE clerkMiddleware() ────────
// svix verifies the HMAC over the raw bytes. clerkMiddleware()
// reads / alters the body stream and breaks signature checks if
// it runs first. Mount the raw-body webhook route here.
app.use("/api/clerk", require("./routes/clerk.routes"));

// ── Clerk middleware (validates session tokens globally) ───────
app.use(clerkMiddleware());

// ── JSON body parser ───────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── API routes ─────────────────────────────────────────────────
app.use("/api/subscription", require("./routes/subscription.routes"));
app.use("/api/user",         require("./routes/user.routes"));
app.use("/api/predict",      require("./routes/prediction.routes"));

// ── Health check ───────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

// ── 404 ────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// ── Global error handler ───────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ success: false, message: err.message || "Server error" });
});

module.exports = app;
