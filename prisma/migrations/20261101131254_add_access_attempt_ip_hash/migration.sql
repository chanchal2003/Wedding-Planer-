/*
  Warnings:

  - Added the required column `ip_hash` to the `access_attempts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "access_attempts" ADD COLUMN     "ip_hash" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "access_attempts_family_id_attempted_at_idx" ON "access_attempts"("family_id", "attempted_at");

-- CreateIndex
CREATE INDEX "access_attempts_ip_hash_attempted_at_idx" ON "access_attempts"("ip_hash", "attempted_at");
