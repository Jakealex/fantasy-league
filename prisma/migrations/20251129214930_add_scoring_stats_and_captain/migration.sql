/*
  Warnings:

  - Made the column `gameweekId` on table `Fixture` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gameweekId` on table `GameweekScore` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Fixture" ALTER COLUMN "gameweekId" SET NOT NULL;

-- AlterTable
ALTER TABLE "GameweekScore" ALTER COLUMN "gameweekId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SquadSlot" ADD COLUMN     "isCaptain" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVice" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PlayerPoints" (
    "id" SERIAL NOT NULL,
    "playerId" TEXT NOT NULL,
    "gameweekId" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "ownGoals" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,
    "goalsConceded" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlayerPoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerPoints_playerId_gameweekId_key" ON "PlayerPoints"("playerId", "gameweekId");

-- AddForeignKey
ALTER TABLE "PlayerPoints" ADD CONSTRAINT "PlayerPoints_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerPoints" ADD CONSTRAINT "PlayerPoints_gameweekId_fkey" FOREIGN KEY ("gameweekId") REFERENCES "Gameweek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
