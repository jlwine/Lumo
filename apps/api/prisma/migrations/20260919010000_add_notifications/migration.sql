CREATE TYPE "NotificationCategory" AS ENUM ('RELATIONSHIP', 'CALENDAR', 'DAY_BOARD');

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationPreferences" (
    "userId" TEXT NOT NULL,
    "relationship" BOOLEAN NOT NULL DEFAULT true,
    "calendar" BOOLEAN NOT NULL DEFAULT true,
    "dayBoard" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("userId")
);

CREATE INDEX "Notification_userId_readAt_createdAt_idx"
ON "Notification"("userId", "readAt", "createdAt");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
