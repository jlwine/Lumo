CREATE TYPE "WishlistArchiveReason" AS ENUM ('RECEIVED', 'NO_LONGER_NEEDED');

ALTER TYPE "WishlistGiftMarkStatus" ADD VALUE 'GIVEN';

ALTER TABLE "WishlistItem"
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "archiveReason" "WishlistArchiveReason";

UPDATE "WishlistItem"
SET "archivedAt" = "updatedAt", "archiveReason" = 'RECEIVED'
WHERE "status" = 'RECEIVED';

UPDATE "WishlistItem"
SET "status" = 'WANT'
WHERE "status" IN ('PLANNED', 'BUY_LATER');

CREATE INDEX "WishlistItem_wishlistId_archivedAt_idx"
ON "WishlistItem"("wishlistId", "archivedAt");
