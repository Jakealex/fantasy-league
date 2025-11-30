-- AlterTable: Make League fields optional for system leagues
ALTER TABLE "League" ALTER COLUMN "inviteCode" DROP NOT NULL;
ALTER TABLE "League" ALTER COLUMN "ownerId" DROP NOT NULL;
ALTER TABLE "League" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "League" ADD COLUMN IF NOT EXISTS "shevet" TEXT;
ALTER TABLE "League" ADD COLUMN IF NOT EXISTS "role" TEXT;

-- AlterTable: Update LeagueMember to use teamId instead of userId
-- First, add teamId column (nullable initially)
ALTER TABLE "LeagueMember" ADD COLUMN IF NOT EXISTS "teamId" TEXT;
ALTER TABLE "LeagueMember" ALTER COLUMN "role" DROP NOT NULL;

-- Migrate existing data: set teamId for existing LeagueMember records
UPDATE "LeagueMember" lm
SET "teamId" = (
  SELECT t.id 
  FROM "Team" t 
  WHERE t."userId" = lm."userId" 
  AND t."leagueId" = lm."leagueId" 
  LIMIT 1
)
WHERE "teamId" IS NULL AND EXISTS (
  SELECT 1 FROM "Team" t 
  WHERE t."userId" = lm."userId" 
  AND t."leagueId" = lm."leagueId"
);

-- Drop old constraints and foreign key
ALTER TABLE "LeagueMember" DROP CONSTRAINT IF EXISTS "LeagueMember_userId_fkey";
DROP INDEX IF EXISTS "LeagueMember_leagueId_userId_key";

-- Drop userId column (after migration)
ALTER TABLE "LeagueMember" DROP COLUMN IF EXISTS "userId";

-- Make teamId required
ALTER TABLE "LeagueMember" ALTER COLUMN "teamId" SET NOT NULL;

-- Add new foreign key and unique constraint
ALTER TABLE "LeagueMember" ADD CONSTRAINT "LeagueMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS "LeagueMember_leagueId_teamId_key" ON "LeagueMember"("leagueId", "teamId");

-- AlterTable: Make Team.leagueId optional
ALTER TABLE "Team" ALTER COLUMN "leagueId" DROP NOT NULL;
