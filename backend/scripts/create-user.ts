/**
 * scripts/create-user.ts
 *
 * General-purpose user creation script. Unlike seed-user.ts (which only
 * ever creates the one hardcoded local admin), this takes the email,
 * password, name, and role as CLI flags - use it to create real VIEWER
 * accounts for staff/family, or additional ADMIN accounts.
 *
 * Usage:
 *   npm run db:create-user -- --email=viewer@mayyat.local --password=viewer123 --name="Staff Viewer" --role=VIEWER
 *
 * Flags:
 *   --email      required
 *   --password   required, min 6 characters
 *   --name       required
 *   --role       optional, ADMIN | VIEWER, defaults to VIEWER
 */

import bcryptjs from "bcryptjs";
import { prisma } from "../src/lib/db.js";

type Role = "ADMIN" | "VIEWER";

function parseArgs() {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) {
      args[match[1]] = match[2];
    }
  }
  return args;
}

async function main() {
  const args = parseArgs();
  const { email, password, name } = args;
  const role = (args.role?.toUpperCase() || "VIEWER") as Role;

  const errors: string[] = [];
  if (!email) errors.push("--email is required");
  if (!password) errors.push("--password is required");
  else if (password.length < 6) errors.push("--password must be at least 6 characters");
  if (!name) errors.push("--name is required");
  if (role !== "ADMIN" && role !== "VIEWER") {
    errors.push(`--role must be ADMIN or VIEWER (got "${args.role}")`);
  }

  if (errors.length > 0) {
    console.error("\n❌  Invalid arguments:\n");
    errors.forEach((e) => console.error(`   - ${e}`));
    console.error(
      '\nUsage: npm run db:create-user -- --email=someone@mayyat.local --password=yourpassword --name="Full Name" --role=VIEWER\n'
    );
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`\n❌  A user with email "${email}" already exists (role: ${existing.role}).\n`);
    process.exit(1);
  }

  const passwordHash = await bcryptjs.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role,
      isActive: true,
    },
  });

  console.log(`\n✅  User created:\n`);
  console.log(`   Email   : ${user.email}`);
  console.log(`   Name    : ${user.name}`);
  console.log(`   Role    : ${user.role}\n`);
}

main()
  .catch((e) => {
    console.error("❌  Failed to create user:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
