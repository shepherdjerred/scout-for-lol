-- DropIndex
DROP INDEX "Competition_serverId_ownerId_key";

-- CreateIndex
CREATE INDEX "Competition_serverId_ownerId_isCancelled_idx" ON "Competition"("serverId", "ownerId", "isCancelled");
