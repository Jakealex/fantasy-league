-- CreateTable
CREATE TABLE "PlayerPoints" (
    "id" SERIAL NOT NULL,
    "playerId" TEXT NOT NULL,
    "gameweekId" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlayerPoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerPoints_playerId_gameweekId_key" ON "PlayerPoints"("playerId", "gameweekId");

-- AddForeignKey
ALTER TABLE "PlayerPoints" ADD CONSTRAINT "PlayerPoints_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerPoints" ADD CONSTRAINT "PlayerPoints_gameweekId_fkey" FOREIGN KEY ("gameweekId") REFERENCES "Gameweek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
