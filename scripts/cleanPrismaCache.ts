// scripts/cleanPrismaCache.ts
// Cleans Prisma cache to fix STUDIO_EMBED_BUILD errors
import { rm } from "fs/promises";
import { execSync } from "child_process";
import { join } from "path";

const PROJECT_ROOT = process.cwd();
const NODE_MODULES = join(PROJECT_ROOT, "node_modules");
const PRISMA_CACHE = join(NODE_MODULES, ".prisma");
const PRISMA_CLIENT = join(NODE_MODULES, "@prisma", "client");

async function cleanPrismaCache() {
  console.log("🧹 Cleaning Prisma cache...\n");

  try {
    // Step 1: Delete .prisma cache directory
    try {
      await rm(PRISMA_CACHE, { recursive: true, force: true });
      console.log("   ✓ Deleted node_modules/.prisma");
    } catch (error) {
      // Directory might not exist, that's fine
      console.log("   ℹ node_modules/.prisma (already clean or doesn't exist)");
    }

    // Step 2: Delete @prisma/client (to force reinstall)
    try {
      await rm(PRISMA_CLIENT, { recursive: true, force: true });
      console.log("   ✓ Deleted node_modules/@prisma/client");
    } catch (error) {
      // Directory might not exist, that's fine
      console.log("   ℹ node_modules/@prisma/client (already clean or doesn't exist)");
    }

    // Step 3: Reinstall Prisma packages
    console.log("\n   📦 Reinstalling Prisma packages...");
    execSync("npm install @prisma/client prisma", {
      stdio: "inherit",
      cwd: PROJECT_ROOT,
    });
    console.log("   ✓ Prisma packages reinstalled");

    // Step 4: Regenerate Prisma Client
    console.log("\n   🔧 Regenerating Prisma Client...");
    execSync("npx prisma generate", {
      stdio: "inherit",
      cwd: PROJECT_ROOT,
    });
    console.log("   ✓ Prisma Client regenerated");

    console.log("\n✅ Prisma cache cleaned successfully!");
    console.log("   You can now run 'npm run studio' without errors.\n");
  } catch (error) {
    console.error("\n❌ Error cleaning Prisma cache:", error);
    process.exit(1);
  }
}

cleanPrismaCache();
