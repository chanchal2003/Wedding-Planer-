/*
  Warnings:

  - You are about to drop the column `banner_key` on the `weddings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "weddings" DROP COLUMN "banner_key";

-- CreateTable
CREATE TABLE "wedding_banners" (
    "wedding_id" UUID NOT NULL,
    "content_type" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "wedding_banners_pkey" PRIMARY KEY ("wedding_id")
);

-- AddForeignKey
ALTER TABLE "wedding_banners" ADD CONSTRAINT "wedding_banners_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The photo is small (the browser shrinks it to about 300 KB) and is a normal picture.
-- The app checks both; these checks are the safety net.
ALTER TABLE "wedding_banners"
  ADD CONSTRAINT "wedding_banners_size_max_1mb" CHECK (octet_length("data") <= 1048576),
  ADD CONSTRAINT "wedding_banners_content_type" CHECK ("content_type" IN ('image/jpeg', 'image/png', 'image/webp'));
