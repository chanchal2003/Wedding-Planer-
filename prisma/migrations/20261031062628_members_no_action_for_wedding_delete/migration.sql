-- DropForeignKey
ALTER TABLE "families" DROP CONSTRAINT "families_assigned_member_id_fkey";

-- DropForeignKey
ALTER TABLE "families" DROP CONSTRAINT "families_invitation_sent_by_fkey";

-- DropForeignKey
ALTER TABLE "replies" DROP CONSTRAINT "replies_updated_by_fkey";

-- AddForeignKey
ALTER TABLE "families" ADD CONSTRAINT "families_assigned_member_id_fkey" FOREIGN KEY ("assigned_member_id") REFERENCES "wedding_members"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "families" ADD CONSTRAINT "families_invitation_sent_by_fkey" FOREIGN KEY ("invitation_sent_by") REFERENCES "wedding_members"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replies" ADD CONSTRAINT "replies_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "wedding_members"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
