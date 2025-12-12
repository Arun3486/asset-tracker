// services/transactionService.js
const prisma = require("../db");
const { normalizeAssetId } = require("./assetService");

async function getTransactionsForAsset(assetId) {
  if (!assetId) {
    throw { status: 400, message: "Asset ID is required." };
  }

  const normAssetId = normalizeAssetId(assetId);

  const list = await prisma.transaction.findMany({
    where: { assetId: normAssetId },
    orderBy: { timestamp: "asc" },
  });

  return list;
}

module.exports = {
  getTransactionsForAsset,
};
