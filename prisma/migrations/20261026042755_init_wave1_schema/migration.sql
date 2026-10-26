-- CreateEnum
CREATE TYPE "member_role" AS ENUM ('admin', 'organizer');

-- CreateEnum
CREATE TYPE "member_relation" AS ENUM ('bride', 'groom', 'parent', 'sibling', 'relative', 'friend', 'other');

-- CreateEnum
CREATE TYPE "member_status" AS ENUM ('pending', 'active', 'removed');

-- CreateEnum
CREATE TYPE "event_type" AS ENUM ('haldi', 'mehendi', 'sangeet', 'mata_ki_chowki', 'wedding', 'reception', 'other');

-- CreateEnum
CREATE TYPE "hosted_by" AS ENUM ('bride', 'groom', 'both');

-- CreateEnum
CREATE TYPE "side" AS ENUM ('bride', 'groom', 'both');

-- CreateEnum
CREATE TYPE "phone_kind" AS ENUM ('primary', 'secondary');

-- CreateEnum
CREATE TYPE "reply_source" AS ENUM ('guest', 'team');

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wedding_id" UUID NOT NULL,
    "type" "event_type" NOT NULL,
    "name" TEXT NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "venue_name" TEXT,
    "map_link" TEXT,
    "note" TEXT,
    "budget_amount_paise" BIGINT,
    "budget_currency" TEXT NOT NULL DEFAULT 'INR',
    "hosted_by" "hosted_by" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "families" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wedding_id" UUID NOT NULL,
    "family_name" TEXT NOT NULL,
    "contact_name" TEXT,
    "city" TEXT,
    "side" "side" NOT NULL,
    "assigned_member_id" UUID,
    "invitation_sent_at" TIMESTAMPTZ(3),
    "invitation_sent_by" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_phones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "kind" "phone_kind" NOT NULL,
    "is_incorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "family_phones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,

    CONSTRAINT "family_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_event_id" UUID NOT NULL,
    "attending" BOOLEAN NOT NULL,
    "persons" INTEGER,
    "replied_by_name" TEXT,
    "source" "reply_source" NOT NULL,
    "updated_by" UUID,
    "replied_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_devices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "device_hash" TEXT NOT NULL,
    "family_id" UUID,
    "succeeded" BOOLEAN NOT NULL,
    "attempted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weddings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "slug_locked" BOOLEAN NOT NULL DEFAULT false,
    "bride_name" TEXT NOT NULL,
    "groom_name" TEXT NOT NULL,
    "wedding_date" DATE NOT NULL,
    "is_test" BOOLEAN NOT NULL DEFAULT false,
    "greeting" TEXT,
    "theme_color" TEXT,
    "banner_key" TEXT,
    "rsvp_last_date" DATE,
    "stay_last_date" DATE,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "weddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wedding_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wedding_id" UUID NOT NULL,
    "user_id" UUID,
    "email" TEXT NOT NULL,
    "role" "member_role" NOT NULL,
    "relation" "member_relation" NOT NULL,
    "can_see_money" BOOLEAN NOT NULL DEFAULT false,
    "status" "member_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "wedding_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_wedding_id_starts_at_idx" ON "events"("wedding_id", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "events_id_wedding_id_key" ON "events"("id", "wedding_id");

-- CreateIndex
CREATE INDEX "families_wedding_id_family_name_idx" ON "families"("wedding_id", "family_name");

-- CreateIndex
CREATE INDEX "families_wedding_id_assigned_member_id_idx" ON "families"("wedding_id", "assigned_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "families_id_wedding_id_key" ON "families"("id", "wedding_id");

-- CreateIndex
CREATE UNIQUE INDEX "family_phones_wedding_id_phone_key" ON "family_phones"("wedding_id", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "family_phones_family_id_kind_key" ON "family_phones"("family_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "family_events_family_id_event_id_key" ON "family_events"("family_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "replies_family_event_id_key" ON "replies"("family_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "guest_devices_token_hash_key" ON "guest_devices"("token_hash");

-- CreateIndex
CREATE INDEX "guest_devices_family_id_idx" ON "guest_devices"("family_id");

-- CreateIndex
CREATE INDEX "access_attempts_device_hash_attempted_at_idx" ON "access_attempts"("device_hash", "attempted_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "weddings_slug_key" ON "weddings"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_members_wedding_id_email_key" ON "wedding_members"("wedding_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_members_wedding_id_user_id_key" ON "wedding_members"("wedding_id", "user_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "families" ADD CONSTRAINT "families_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "families" ADD CONSTRAINT "families_assigned_member_id_fkey" FOREIGN KEY ("assigned_member_id") REFERENCES "wedding_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "families" ADD CONSTRAINT "families_invitation_sent_by_fkey" FOREIGN KEY ("invitation_sent_by") REFERENCES "wedding_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_phones" ADD CONSTRAINT "family_phones_family_id_wedding_id_fkey" FOREIGN KEY ("family_id", "wedding_id") REFERENCES "families"("id", "wedding_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_phones" ADD CONSTRAINT "family_phones_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_events" ADD CONSTRAINT "family_events_family_id_wedding_id_fkey" FOREIGN KEY ("family_id", "wedding_id") REFERENCES "families"("id", "wedding_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_events" ADD CONSTRAINT "family_events_event_id_wedding_id_fkey" FOREIGN KEY ("event_id", "wedding_id") REFERENCES "events"("id", "wedding_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replies" ADD CONSTRAINT "replies_family_event_id_fkey" FOREIGN KEY ("family_event_id") REFERENCES "family_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replies" ADD CONSTRAINT "replies_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "wedding_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_devices" ADD CONSTRAINT "guest_devices_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_attempts" ADD CONSTRAINT "access_attempts_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weddings" ADD CONSTRAINT "weddings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_members" ADD CONSTRAINT "wedding_members_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_members" ADD CONSTRAINT "wedding_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- Checks that Prisma cannot write in the schema files.
-- Added by hand to this migration, as agreed in the database design document.
-- ============================================================================

-- AddCheck: a pending team member has no signed-in user, an active one has a
-- signed-in user, and a removed one may have either.
ALTER TABLE "wedding_members" ADD CONSTRAINT "wedding_members_status_user_check"
  CHECK (
    ("status" = 'pending' AND "user_id" IS NULL)
    OR ("status" = 'active' AND "user_id" IS NOT NULL)
    OR "status" = 'removed'
  );

-- AddCheck: the stay last date is earlier than the RSVP last date
-- (when both are set).
ALTER TABLE "weddings" ADD CONSTRAINT "weddings_stay_before_rsvp_check"
  CHECK (
    "stay_last_date" IS NULL
    OR "rsvp_last_date" IS NULL
    OR "stay_last_date" < "rsvp_last_date"
  );

-- AddCheck: a reply that says yes needs at least 1 person.
ALTER TABLE "replies" ADD CONSTRAINT "replies_persons_check"
  CHECK ("attending" = false OR ("persons" IS NOT NULL AND "persons" >= 1));
