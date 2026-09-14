CREATE TYPE "WishlistItemStatus" AS ENUM (
    'WANT',
    'PLANNED',
    'BUY_LATER',
    'RECEIVED'
);

CREATE TYPE "WishlistGiftMarkStatus" AS ENUM (
    'PLANNING',
    'PURCHASED'
);

ALTER TABLE "WishlistItem"
ADD COLUMN "status" "WishlistItemStatus" NOT NULL DEFAULT 'WANT';

CREATE TABLE "WishlistGiftMark" (
    "itemId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "status" "WishlistGiftMarkStatus" NOT NULL DEFAULT 'PLANNING',
    "hiddenFromOwner" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishlistGiftMark_pkey" PRIMARY KEY ("itemId", "partnerId")
);

CREATE INDEX "WishlistGiftMark_partnerId_idx"
ON "WishlistGiftMark"("partnerId");

ALTER TABLE "WishlistGiftMark"
ADD CONSTRAINT "WishlistGiftMark_itemId_fkey"
FOREIGN KEY ("itemId") REFERENCES "WishlistItem"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WishlistGiftMark"
ADD CONSTRAINT "WishlistGiftMark_partnerId_fkey"
FOREIGN KEY ("partnerId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
