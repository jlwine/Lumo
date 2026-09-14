-- CreateEnum
CREATE TYPE "CalendarEventScope" AS ENUM ('PERSONAL', 'SHARED');

-- CreateEnum
CREATE TYPE "CalendarEventParticipantRole" AS ENUM ('OWNER', 'EDITOR');

-- Existing calendar events were shared events of a relationship.
ALTER TABLE "CalendarEvent"
ADD COLUMN "scope" "CalendarEventScope" NOT NULL DEFAULT 'PERSONAL';

UPDATE "CalendarEvent"
SET "scope" = 'SHARED'
WHERE "relationshipId" IS NOT NULL;

-- Personal events do not belong to a relationship.
ALTER TABLE "CalendarEvent"
ALTER COLUMN "relationshipId" DROP NOT NULL;

ALTER TABLE "CalendarEvent"
DROP CONSTRAINT "CalendarEvent_relationshipId_fkey";

ALTER TABLE "CalendarEvent"
ADD CONSTRAINT "CalendarEvent_relationshipId_fkey"
FOREIGN KEY ("relationshipId") REFERENCES "Relationship"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CalendarEventParticipant" (
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CalendarEventParticipantRole" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarEventParticipant_pkey" PRIMARY KEY ("eventId", "userId")
);

-- The creator owns every existing event.
INSERT INTO "CalendarEventParticipant" ("eventId", "userId", "role")
SELECT "id", "createdById", 'OWNER'
FROM "CalendarEvent";

-- Both members keep access to every existing shared event.
INSERT INTO "CalendarEventParticipant" ("eventId", "userId", "role")
SELECT event."id", relationship."user1Id", 'EDITOR'
FROM "CalendarEvent" AS event
JOIN "Relationship" AS relationship ON relationship."id" = event."relationshipId"
ON CONFLICT ("eventId", "userId") DO NOTHING;

INSERT INTO "CalendarEventParticipant" ("eventId", "userId", "role")
SELECT event."id", relationship."user2Id", 'EDITOR'
FROM "CalendarEvent" AS event
JOIN "Relationship" AS relationship ON relationship."id" = event."relationshipId"
ON CONFLICT ("eventId", "userId") DO NOTHING;

-- CreateIndex
CREATE INDEX "CalendarEventParticipant_userId_idx"
ON "CalendarEventParticipant"("userId");

-- AddForeignKey
ALTER TABLE "CalendarEventParticipant"
ADD CONSTRAINT "CalendarEventParticipant_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CalendarEventParticipant"
ADD CONSTRAINT "CalendarEventParticipant_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
