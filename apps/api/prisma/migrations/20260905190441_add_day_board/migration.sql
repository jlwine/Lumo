-- CreateTable
CREATE TABLE "DayBoardEntry" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "boardDate" DATE NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DayBoardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DayBoardEntry_relationshipId_boardDate_idx" ON "DayBoardEntry"("relationshipId", "boardDate");

-- CreateIndex
CREATE INDEX "DayBoardEntry_authorId_boardDate_idx" ON "DayBoardEntry"("authorId", "boardDate");

-- CreateIndex
CREATE UNIQUE INDEX "DayBoardEntry_relationshipId_authorId_boardDate_key" ON "DayBoardEntry"("relationshipId", "authorId", "boardDate");

-- AddForeignKey
ALTER TABLE "DayBoardEntry" ADD CONSTRAINT "DayBoardEntry_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayBoardEntry" ADD CONSTRAINT "DayBoardEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
