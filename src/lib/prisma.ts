import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// IMPORTANT: DATABASE_URL must be a standard Postgres URL (postgresql://...)
// Prisma Studio requires standard Postgres URLs and cannot use accelerated URLs (prisma+postgres://)
// If you need Prisma Accelerate in production, you must use @prisma/extension-accelerate
// See DATABASE_URL_SETUP.md for configuration details
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is not set. " +
    "Use a standard Postgres URL (postgresql://user:pass@host:port/db?sslmode=require&schema=public). " +
    "Accelerated URLs (prisma+postgres://) cannot be used directly - see DATABASE_URL_SETUP.md for details."
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
