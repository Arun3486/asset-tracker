// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

const employeeRoutes = require("./routes/employees");
const assetRoutes = require("./routes/assets");
const transactionRoutes = require("./routes/transactions");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * 0) Serve frontend (static files)
 * Your repo structure is:
 *   /public
 *   /backend
 * So from backend, public is: ../public
 */
const publicDir = path.join(__dirname, "..", "public");
const indexPath = path.join(publicDir, "index.html");

console.log("Serving static files from:", publicDir);
app.use(express.static(publicDir));

/**
 * 1) CORS (important for browser-based frontend + cookies)
 */
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
];

// Add your Render URL automatically (example: https://asset-tracker-o3lk.onrender.com)
if (process.env.RENDER_EXTERNAL_URL) {
  ALLOWED_ORIGINS.push(process.env.RENDER_EXTERNAL_URL);
}

// If you set FRONTEND_URL manually later, allow it too
if (process.env.FRONTEND_URL) {
  ALLOWED_ORIGINS.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser calls (curl/postman) which have no origin
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);

      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  })
);

/**
 * 2) Basic middleware
 */
app.use(express.json());

/**
 * 3) Sessions
 * - MemoryStore is OK for now (small internal tool)
 */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // If frontend and backend are on SAME domain (Render web service serving public),
      // "lax" is perfect and simpler.
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  })
);

/**
 * 4) Auth guard
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ message: "Not authenticated." });
}

/**
 * 5) Health check (API)
 */
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "asset-tracker-backend" });
});

/**
 * 6) Root route: serve frontend home page
 */
app.get("/", (req, res) => {
  if (!fs.existsSync(indexPath)) {
    return res
      .status(404)
      .send("Frontend not found on server. public/index.html is missing.");
  }
  return res.sendFile(indexPath);
});

/**
 * 7) Routes
 * Auth routes do not require login
 */
app.use("/api/auth", authRoutes);

// Everything else requires login
app.use("/api/employees", requireAuth, employeeRoutes);
app.use("/api/assets", requireAuth, assetRoutes);
app.use("/api/transactions", requireAuth, transactionRoutes);

/**
 * 8) Start server
 */
app.listen(PORT, () => {
  console.log(`Asset Tracker backend listening on port ${PORT}`);
});
