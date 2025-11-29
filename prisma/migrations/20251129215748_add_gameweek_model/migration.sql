-- CreateTable
CREATE TABLE "Gameweek" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "isFinished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Gameweek_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gameweek_number_key" ON "Gameweek"("number");

-- AlterTable
ALTER TABLE "Fixture" ADD COLUMN "gameweekId" INTEGER;

-- AlterTable
ALTER TABLE "GameweekScore" ADD COLUMN "gameweekId" INTEGER;

-- DropIndex
DROP INDEX IF EXISTS "GameweekScore_teamId_gw_key";

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_gameweekId_fkey" FOREIGN KEY ("gameweekId") REFERENCES "Gameweek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameweekScore" ADD CONSTRAINT "GameweekScore_gameweekId_fkey" FOREIGN KEY ("gameweekId") REFERENCES "Gameweek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "GameweekScore_teamId_gameweekId_key" ON "GameweekScore"("teamId", "gameweekId");

-- AlterTable: Drop old gw column from Fixture
ALTER TABLE "Fixture" DROP COLUMN "gw";

-- AlterTable: Drop old gw column from GameweekScore
ALTER TABLE "GameweekScore" DROP COLUMN "gw";

