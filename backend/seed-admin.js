require("dotenv").config();
const prisma = require("./db");
const bcrypt = require("bcryptjs");

async function main() {
  const email = "admin@company.com";
  const password = "Admin@12345";
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log("✅ Admin already exists:", email);
    return;
  }

  await prisma.user.create({
    data: { email, passwordHash, role: "admin" },
  });

  console.log("✅ Admin created");
  console.log("Email:", email);
  console.log("Password:", password);
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());
