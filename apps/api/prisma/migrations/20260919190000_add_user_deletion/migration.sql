ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Relationship" ADD COLUMN "archivedWishlists" JSONB;
