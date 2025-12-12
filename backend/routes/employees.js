// routes/employees.js
const express = require("express");
const router = express.Router();

const {
  createEmployee,
  getEmployeeByEmail,
  updateEmployeeStatus,
  listEmployees,
} = require("../services/employeeService");

// Helper: uniform error handling
function handleError(res, err, logPrefix) {
  console.error(logPrefix, err);
  if (err && err.status) {
    return res.status(err.status).json({ message: err.message });
  }
  return res.status(500).json({ message: "Internal server error." });
}

// POST /api/employees
router.post("/", async (req, res) => {
  try {
    const employee = await createEmployee(req.body || {});
    res.status(201).json(employee);
  } catch (err) {
    handleError(res, err, "Error creating employee:");
  }
});

// GET /api/employees?email=...
router.get("/", async (req, res) => {
  try {
    const email = (req.query.email || "").trim();
    const employee = await getEmployeeByEmail(email);
    res.json(employee);
  } catch (err) {
    handleError(res, err, "Error fetching employee:");
  }
});

// PUT /api/employees/status
router.put("/status", async (req, res) => {
  try {
    const { email, status } = req.body || {};
    const updated = await updateEmployeeStatus(email, status);
    res.json(updated);
  } catch (err) {
    handleError(res, err, "Error updating employee status:");
  }
});

// GET /api/employees/all
router.get("/all", async (req, res) => {
  try {
    const statusFilter = (req.query.status || "").trim();
    const employees = await listEmployees(statusFilter);
    res.json(employees);
  } catch (err) {
    handleError(res, err, "Error listing employees:");
  }
});

module.exports = router;
