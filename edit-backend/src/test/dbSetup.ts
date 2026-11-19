import { beforeEach } from "vitest";

// src/lib/prisma.ts connects with the MYSQL_* vars, so that is what must
// point at a test database. Vitest does not load edit-backend/.env into
// process.env, so only the env given on the command line is used.
const database = process.env.MYSQL_DATABASE ?? "";
const url = process.env.DATABASE_URL;
if (
  !database.includes("test") ||
  (url !== undefined && !url.includes("test"))
) {
  throw new Error(
    "Refusing to run db tests: MYSQL_DATABASE (and DATABASE_URL, if set) must name a test database",
  );
}

const { default: prisma } = await import("@/lib/prisma");

beforeEach(async () => {
  // Children first so foreign keys never block the deletes.
  await prisma.articlesAuthors.deleteMany();
  await prisma.articlesCategories.deleteMany();
  await prisma.articlesDrafts.deleteMany();
  await prisma.articles.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.emailSent.deleteMany();
});
