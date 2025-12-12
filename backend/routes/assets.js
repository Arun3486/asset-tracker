// routes/assets.js
const express = require("express");
const router = express.Router();

const {
  createAsset,
  getAssetById,
  listAssets,
  issueAsset,
  returnAsset,
} = require("../services/assetService");

// Helper: uniform error handling
function handleError(res, err, logPrefix) {
  console.error(logPrefix, err);
  if (err && err.status) {
    return res.status(err.status).json({ message: err.message });
  }
  return res.status(500).json({ message: "Internal server error." });
}

// POST /api/assets
router.post("/", async (req, res) => {
  try {
    const asset = await createAsset(req.body || {});
    res.status(201).json(asset);
  } catch (err) {
    handleError(res, err, "Error creating asset:");
  }
});

// GET /api/assets?assetId=...
router.get("/", async (req, res) => {
  try {
    const assetId = (req.query.assetId || "").trim();
    const asset = await getAssetById(assetId);
    res.json(asset);
  } catch (err) {
    handleError(res, err, "Error fetching asset:");
  }
});

// GET /api/assets/all
router.get("/all", async (req, res) => {
  try {
    const stockStatus = (req.query.stockStatus || "").trim();
    const location = (req.query.location || "").trim();
    const assets = await listAssets({ stockStatus, location });
    res.json(assets);
  } catch (err) {
    handleError(res, err, "Error listing assets:");
  }
});

// POST /api/assets/issue
router.post("/issue", async (req, res) => {
  try {
    const result = await issueAsset(req.body || {});
    res.json(result);
  } catch (err) {
    handleError(res, err, "Error issuing asset:");
  }
});

// POST /api/assets/return
router.post("/return", async (req, res) => {
  try {
    const result = await returnAsset(req.body || {});
    res.json(result);
  } catch (err) {
    handleError(res, err, "Error returning asset:");
  }
});

module.exports = router;
