// routes/transactions.js
const express = require("express");
const router = express.Router();

const { getTransactionsForAsset } = require("../services/transactionService");

function handleError(res, err, logPrefix) {
  console.error(logPrefix, err);
  if (err && err.status) {
    return res.status(err.status).json({ message: err.message });
  }
  return res.status(500).json({ message: "Internal server error." });
}

// GET /api/transactions?assetId=...
router.get("/", async (req, res) => {
  try {
    const assetId = (req.query.assetId || "").trim();
    const list = await getTransactionsForAsset(assetId);
    res.json(list);
  } catch (err) {
    handleError(res, err, "Error listing transactions:");
  }
});

module.exports = router;
