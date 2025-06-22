-- DropForeignKey
ALTER TABLE "FollowUp" DROP CONSTRAINT "FollowUp_leadId_fkey";

-- AlterTable
ALTER TABLE "FollowUp" ADD COLUMN     "taskDate" TIMESTAMP(3),
ADD COLUMN     "taskForUser" TEXT,
ADD COLUMN     "taskTime" TEXT,
ALTER COLUMN "createdBy" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "FollowUp_leadId_idx" ON "FollowUp"("leadId");

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
