// services/assetService.js
const prisma = require("../db");
const { normalizeEmail } = require("./employeeService");

function normalizeAssetId(assetId) {
  return assetId.trim().toUpperCase();
}

// Helper: parse "YYYY-MM-DD" or ISO string into a real Date
function parseDateOrThrow(value, fieldName) {
  if (!value) {
    throw { status: 400, message: `${fieldName} is required.` };
  }

  // If already a Date, accept it
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  // Most of your UI will send "YYYY-MM-DD"
  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    throw { status: 400, message: `Invalid ${fieldName}. Please use a valid date.` };
  }

  return d;
}

// ----- Basic asset operations -----

async function createAsset(payload) {
  const {
    assetId,
    serialNo,
    type,
    model,
    os,
    dateOfPurchase,
    stockStatus,
    workingStatus,
    location,
  } = payload || {};

  if (!assetId || !serialNo || !model || !dateOfPurchase) {
    throw {
      status: 400,
      message: "Asset ID, Serial No, Model and Date of Purchase are required.",
    };
  }

  const normAssetId = normalizeAssetId(assetId);

  const existing = await prisma.asset.findUnique({
    where: { assetId: normAssetId },
  });

  if (existing) {
    throw {
      status: 409,
      message: "Asset with this ID already exists.",
    };
  }

  const purchaseDate = parseDateOrThrow(dateOfPurchase, "Date of Purchase");

  const newAsset = await prisma.asset.create({
    data: {
      assetId: normAssetId,
      serialNo: serialNo.trim(),
      type: type || "Laptop",
      model: model.trim(),
      os: os || "Windows",

      // ✅ Prisma expects DateTime => pass a Date object
      dateOfPurchase: purchaseDate,

      stockStatus: stockStatus || "In-Stock",
      workingStatus: workingStatus || "Working",
      location: location || "Bangalore",

      // issuedToEmail starts empty when in stock
      issuedToEmail: null,
    },
  });

  return newAsset;
}

async function getAssetById(assetId) {
  if (!assetId) {
    throw { status: 400, message: "Asset ID is required." };
  }

  const normAssetId = normalizeAssetId(assetId);

  const asset = await prisma.asset.findUnique({
    where: { assetId: normAssetId },
  });

  if (!asset) {
    throw { status: 404, message: "Asset not found." };
  }

  const currentHolder = await getCurrentHolderForAsset(normAssetId);

  return {
    ...asset,
    currentHolder,
  };
}

async function listAssets(filters = {}) {
  const { stockStatus, location } = filters;

  const where = {};
  if (stockStatus) where.stockStatus = stockStatus;
  if (location) where.location = location;

  const assets = await prisma.asset.findMany({
    where,
    orderBy: { id: "asc" },
  });

  return assets;
}

// ----- Helper: current holder via last ISSUE transaction -----

async function getCurrentHolderForAsset(normAssetId) {
  const lastTx = await prisma.transaction.findFirst({
    where: { assetId: normAssetId },
    orderBy: { timestamp: "desc" },
  });

  if (!lastTx || lastTx.type !== "ISSUE") {
    return null;
  }

  const emp = await prisma.employee.findUnique({
    where: { email: lastTx.employeeEmail },
  });

  if (!emp) return null;

  return {
    name: emp.name,
    email: emp.email,
    status: emp.status,
  };
}

// ----- Issue asset -----

async function issueAsset({ assetId, employeeEmail, reasonType, comments }) {
  if (!assetId || !employeeEmail) {
    throw {
      status: 400,
      message: "Asset ID and Employee Email are required.",
    };
  }

  const normAssetId = normalizeAssetId(assetId);
  const normEmail = normalizeEmail(employeeEmail);

  const asset = await prisma.asset.findUnique({
    where: { assetId: normAssetId },
  });

  if (!asset) {
    throw { status: 404, message: "Asset not found." };
  }

  const emp = await prisma.employee.findUnique({
    where: { email: normEmail },
  });

  if (!emp) {
    throw { status: 404, message: "Employee not found." };
  }

  if (emp.status !== "Active") {
    throw { status: 400, message: "Employee is not Active." };
  }

  if (asset.stockStatus !== "In-Stock") {
    throw { status: 400, message: "Asset is not In-Stock." };
  }

  if (asset.workingStatus !== "Working") {
    throw { status: 400, message: "Asset is not in Working status." };
  }

  // ✅ Create transaction (timestamp auto-set by schema)
  const tx = await prisma.transaction.create({
    data: {
      type: "ISSUE",
      assetId: normAssetId,
      employeeEmail: normEmail,
      reasonType: reasonType || "New Employee",
      comments: comments || "",
      fromLocation: asset.location,
      toLocation: "With Employee",
    },
  });

  // ✅ Update asset status + who holds it
  const updatedAsset = await prisma.asset.update({
    where: { assetId: normAssetId },
    data: {
      stockStatus: "Issued",
      location: "With Employee",
      issuedToEmail: normEmail,
    },
  });

  const holder = await getCurrentHolderForAsset(normAssetId);

  return {
    asset: {
      ...updatedAsset,
      currentHolder: holder,
    },
    transaction: tx,
  };
}

// ----- Return asset -----

async function returnAsset({
  assetId,
  employeeEmail,
  reasonType,
  comments,
  returnLocation,
}) {
  if (!assetId || !employeeEmail) {
    throw {
      status: 400,
      message: "Asset ID and Employee Email are required.",
    };
  }

  const normAssetId = normalizeAssetId(assetId);
  const normEmail = normalizeEmail(employeeEmail);

  const asset = await prisma.asset.findUnique({
    where: { assetId: normAssetId },
  });

  if (!asset) {
    throw { status: 404, message: "Asset not found." };
  }

  const emp = await prisma.employee.findUnique({
    where: { email: normEmail },
  });

  if (!emp) {
    throw { status: 404, message: "Employee not found." };
  }

  const lastTx = await prisma.transaction.findFirst({
    where: { assetId: normAssetId },
    orderBy: { timestamp: "desc" },
  });

  if (!lastTx || lastTx.type !== "ISSUE") {
    throw {
      status: 400,
      message: "This asset is not currently issued.",
    };
  }

  if (lastTx.employeeEmail !== normEmail) {
    throw {
      status: 400,
      message:
        "Asset is not currently issued to this employee. Please check the email.",
    };
  }

  // Working status rule based on reason
  const newWorkingStatus = reasonType === "Not Working" ? "Not-Working" : "Working";
  const toLocation = returnLocation || "Bangalore";

  // ✅ Create transaction (timestamp auto-set by schema)
  const tx = await prisma.transaction.create({
    data: {
      type: "RETURN",
      assetId: normAssetId,
      employeeEmail: normEmail,
      reasonType: reasonType || "Return",
      comments: comments || "",
      fromLocation: asset.location,
      toLocation,
    },
  });

  // ✅ Update asset + clear issuedToEmail
  const updatedAsset = await prisma.asset.update({
    where: { assetId: normAssetId },
    data: {
      stockStatus: "In-Stock",
      location: toLocation,
      workingStatus: newWorkingStatus,
      issuedToEmail: null,
    },
  });

  const holder = await getCurrentHolderForAsset(normAssetId);

  return {
    asset: {
      ...updatedAsset,
      currentHolder: holder,
    },
    transaction: tx,
  };
}

module.exports = {
  createAsset,
  getAssetById,
  listAssets,
  issueAsset,
  returnAsset,
  normalizeAssetId,
  getCurrentHolderForAsset,
};
