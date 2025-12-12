// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");

const employeeRoutes = require("./routes/employees");
const assetRoutes = require("./routes/assets");
const transactionRoutes = require("./routes/transactions");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * 1) CORS (very important for browser-based frontend)
 * - FRONTEND_URL should be your Render Static Site URL later
 *   Example: https://asset-tracker-ui.onrender.com
 */
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
];

if (process.env.FRONTEND_URL) {
  ALLOWED_ORIGINS.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser calls (like curl/postman) which have no origin
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
 * NOTE:
 * - MemoryStore is OK for now (small internal tool)
 * - Later we can move to Redis if needed
 */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // IMPORTANT for Render: frontend and backend are on different domains
      // "none" + secure=true is required in production for cookies to work cross-site
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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
 * 5) Health + Root (API only)
 */
app.get("/", (req, res) => {
  res.json({ ok: true, service: "asset-tracker-backend" });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "asset-tracker-backend" });
});

/**
 * 6) Routes
 * Auth routes do not require login
 */
app.use("/api/auth", authRoutes);

// Everything else requires login
app.use("/api/employees", requireAuth, employeeRoutes);
app.use("/api/assets", requireAuth, assetRoutes);
app.use("/api/transactions", requireAuth, transactionRoutes);

/**
 * 7) Start server
 */
app.listen(PORT, () => {
  console.log(`Asset Tracker backend listening on port ${PORT}`);
});
