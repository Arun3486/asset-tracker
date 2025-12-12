// services/authService.js
const prisma = require("../db");
const bcrypt = require("bcryptjs");
const { normalizeEmail } = require("./employeeService");

// Helper: create a user (for now we use this via /register)
async function registerUser({ email, password, role }) {
  if (!email || !password) {
    throw { status: 400, message: "Email and password are required." };
  }

  const normEmail = normalizeEmail(email);

  const existing = await prisma.user.findUnique({
    where: { email: normEmail },
  });

  if (existing) {
    throw { status: 409, message: "User already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: normEmail,
      passwordHash,
      role: role || "admin",
    },
  });

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

// Helper: check login credentials
async function loginUser({ email, password }) {
  if (!email || !password) {
    throw { status: 400, message: "Email and password are required." };
  }

  const normEmail = normalizeEmail(email);

  const user = await prisma.user.findUnique({
    where: { email: normEmail },
  });

  if (!user) {
    throw { status: 401, message: "Invalid email or password." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw { status: 401, message: "Invalid email or password." };
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

module.exports = {
  registerUser,
  loginUser,
};
