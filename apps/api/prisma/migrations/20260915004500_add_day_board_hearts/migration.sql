CREATE TABLE "DayBoardReaction" (
    "entryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DayBoardReaction_pkey" PRIMARY KEY ("entryId", "userId")
);

CREATE INDEX "DayBoardReaction_userId_idx"
ON "DayBoardReaction"("userId");

ALTER TABLE "DayBoardReaction"
ADD CONSTRAINT "DayBoardReaction_entryId_fkey"
FOREIGN KEY ("entryId") REFERENCES "DayBoardEntry"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DayBoardReaction"
ADD CONSTRAINT "DayBoardReaction_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
