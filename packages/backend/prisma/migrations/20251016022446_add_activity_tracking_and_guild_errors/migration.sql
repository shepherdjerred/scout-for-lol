-- AlterTable: Add lastSeenInGame to Account table for dynamic polling
ALTER TABLE "Account" ADD COLUMN "lastSeenInGame" DATETIME;

-- CreateTable: Guild permission error tracking
CREATE TABLE "GuildPermissionError" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serverId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "errorType" TEXT NOT NULL,
    "errorReason" TEXT,
    "firstOccurrence" DATETIME NOT NULL,
    "lastOccurrence" DATETIME NOT NULL,
    "consecutiveErrorCount" INTEGER NOT NULL DEFAULT 1,
    "lastSuccessfulSend" DATETIME,
    "ownerNotified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "GuildPermissionError_serverId_channelId_key" ON "GuildPermissionError"("serverId", "channelId");

-- CreateIndex
CREATE INDEX "GuildPermissionError_serverId_consecutiveErrorCount_idx" ON "GuildPermissionError"("serverId", "consecutiveErrorCount");

-- CreateIndex
CREATE INDEX "GuildPermissionError_lastOccurrence_idx" ON "GuildPermissionError"("lastOccurrence");
