// routes/auth.js
const express = require("express");
const router = express.Router();

const { registerUser, loginUser } = require("../services/authService");

function handleError(res, err, logPrefix) {
  console.error(logPrefix, err);
  if (err && err.status) {
    return res.status(err.status).json({ message: err.message });
  }
  return res.status(500).json({ message: "Internal server error." });
}

// POST /api/auth/register
// Use this once to create your admin user, then you can disable it later if you want.
router.post("/register", async (req, res) => {
  try {
    const user = await registerUser(req.body || {});
    res.status(201).json(user);
  } catch (err) {
    handleError(res, err, "Error registering user:");
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const user = await loginUser(req.body || {});

    // Store minimal info in session
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    res.json({
      message: "Logged in successfully.",
      user: req.session.user,
    });
  } catch (err) {
    handleError(res, err, "Error logging in user:");
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully." });
  });
});

// GET /api/auth/me
router.get("/me", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Not authenticated." });
  }
  res.json(req.session.user);
});

module.exports = router;
