// services/employeeService.js
const prisma = require("../db");

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function createEmployee({ name, email }) {
  if (!name || !email) {
    throw { status: 400, message: "Name and email are required." };
  }

  const normEmail = normalizeEmail(email);

  const existing = await prisma.employee.findUnique({
    where: { email: normEmail },
  });

  if (existing) {
    throw { status: 409, message: "Employee already exists." };
  }

  const newEmployee = await prisma.employee.create({
    data: {
      name: name.trim(),
      email: normEmail,
      status: "Active",
    },
  });

  return newEmployee;
}

async function getEmployeeByEmail(email) {
  if (!email) {
    throw { status: 400, message: "Email is required." };
  }

  const normEmail = normalizeEmail(email);

  const emp = await prisma.employee.findUnique({
    where: { email: normEmail },
  });

  if (!emp) {
    throw { status: 404, message: "Employee not found." };
  }

  return emp;
}

async function updateEmployeeStatus(email, status) {
  if (!email || !status) {
    throw { status: 400, message: "Email and status are required." };
  }

  if (!["Active", "Inactive"].includes(status)) {
    throw { status: 400, message: "Invalid status value." };
  }

  const normEmail = normalizeEmail(email);

  const existing = await prisma.employee.findUnique({
    where: { email: normEmail },
  });

  if (!existing) {
    throw { status: 404, message: "Employee not found." };
  }

  const updated = await prisma.employee.update({
    where: { email: normEmail },
    data: { status },
  });

  return updated;
}

async function listEmployees(statusFilter) {
  const where = statusFilter ? { status: statusFilter } : {};

  const employees = await prisma.employee.findMany({
    where,
    orderBy: { id: "asc" },
  });

  return employees;
}

module.exports = {
  createEmployee,
  getEmployeeByEmail,
  updateEmployeeStatus,
  listEmployees,
  normalizeEmail, // exported so assetService can reuse
};
