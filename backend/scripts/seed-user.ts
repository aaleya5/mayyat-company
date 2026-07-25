/**
 * scripts/seed-user.ts
 * Creates a test admin user for local development
 *
 * Run once: npm run db:seed:user
 */

import bcryptjs from "bcryptjs";
import { prisma } from "../src/lib/db.js";

async function main() {
  const email = "admin@mayyat.local";
  const password = "admin123"; // Change this!

  console.log(`\n🌱  Creating admin user: ${email}`);

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("   Already exists. Skipping.");
    return;
  }

  const passwordHash = await bcryptjs.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: "Admin",
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(`\n✅  User created:\n`);
  console.log(`   Email   : ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role    : ${user.role}\n`);
  console.log("   ⚠️  Change the password after first login!\n");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
