-- Create EventType enum
CREATE TYPE "EventType" AS ENUM ('GOAL', 'ASSIST', 'YC', 'RC', 'OG');

-- Add homeGoals and awayGoals to Fixture
ALTER TABLE "Fixture" ADD COLUMN IF NOT EXISTS "homeGoals" INTEGER;
ALTER TABLE "Fixture" ADD COLUMN IF NOT EXISTS "awayGoals" INTEGER;

-- Add minute field to ScoreEvent
ALTER TABLE "ScoreEvent" ADD COLUMN IF NOT EXISTS "minute" INTEGER;

-- Convert ScoreEvent.type from String to EventType enum
-- Step 1: Add temporary column with enum type
ALTER TABLE "ScoreEvent" ADD COLUMN IF NOT EXISTS "type_new" "EventType";

-- Step 2: Migrate existing data (if any) - map string values to enum
-- Assuming existing data uses uppercase strings matching enum values
UPDATE "ScoreEvent" SET "type_new" = CASE 
  WHEN "type" = 'GOAL' THEN 'GOAL'::"EventType"
  WHEN "type" = 'ASSIST' THEN 'ASSIST'::"EventType"
  WHEN "type" = 'YC' THEN 'YC'::"EventType"
  WHEN "type" = 'RC' THEN 'RC'::"EventType"
  WHEN "type" = 'OG' THEN 'OG'::"EventType"
  ELSE 'GOAL'::"EventType" -- default fallback
END WHERE "type_new" IS NULL;

-- Step 3: Drop old column and value column
ALTER TABLE "ScoreEvent" DROP COLUMN IF EXISTS "type";
ALTER TABLE "ScoreEvent" DROP COLUMN IF EXISTS "value";

-- Step 4: Rename new column
ALTER TABLE "ScoreEvent" RENAME COLUMN "type_new" TO "type";

-- Step 5: Make type NOT NULL
ALTER TABLE "ScoreEvent" ALTER COLUMN "type" SET NOT NULL;

