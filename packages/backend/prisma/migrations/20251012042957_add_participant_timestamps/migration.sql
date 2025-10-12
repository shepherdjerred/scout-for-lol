-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CompetitionParticipant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "competitionId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "invitedBy" TEXT,
    "invitedAt" DATETIME,
    "joinedAt" DATETIME,
    "leftAt" DATETIME,
    CONSTRAINT "CompetitionParticipant_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompetitionParticipant_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CompetitionParticipant" ("competitionId", "id", "invitedBy", "joinedAt", "leftAt", "playerId", "status") SELECT "competitionId", "id", "invitedBy", "joinedAt", "leftAt", "playerId", "status" FROM "CompetitionParticipant";
DROP TABLE "CompetitionParticipant";
ALTER TABLE "new_CompetitionParticipant" RENAME TO "CompetitionParticipant";
CREATE INDEX "CompetitionParticipant_competitionId_status_idx" ON "CompetitionParticipant"("competitionId", "status");
CREATE UNIQUE INDEX "CompetitionParticipant_competitionId_playerId_key" ON "CompetitionParticipant"("competitionId", "playerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
