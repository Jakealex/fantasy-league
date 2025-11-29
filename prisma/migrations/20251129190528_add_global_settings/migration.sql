-- CreateTable
CREATE TABLE "GlobalSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "transfersOpen" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GlobalSettings_pkey" PRIMARY KEY ("id")
);
