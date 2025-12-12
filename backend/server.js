// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const path = require("path");

const employeeRoutes = require("./routes/employees");
const assetRoutes = require("./routes/assets");
const transactionRoutes = require("./routes/transactions");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Render runs behind a proxy (HTTPS terminates at proxy)
app.set("trust proxy", 1);

// Serve frontend (repoRoot/public) via backend
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

/**
 * CORS
 * Since frontend is served from SAME origin, CORS is not strictly needed,
 * but keeping it doesn't hurt for local dev or tools like Postman.
 */
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  "https://asset-tracker-o3lk.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Postman/curl
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  })
);

app.use(express.json());

/**
 * Sessions
 * ✅ For SAME domain frontend+backend: sameSite MUST be "lax"
 * ✅ On Render HTTPS: secure MUST be true in production
 */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    name: "asset_tracker_sid",
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true on Render
      sameSite: "lax", // ✅ important for same-domain app
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);

// Auth guard
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ message: "Not authenticated." });
}

// Root: serve UI (index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// Health
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "asset-tracker-backend" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", requireAuth, employeeRoutes);
app.use("/api/assets", requireAuth, assetRoutes);
app.use("/api/transactions", requireAuth, transactionRoutes);

app.listen(PORT, () => {
  console.log(`Asset Tracker backend listening on port ${PORT}`);
});
