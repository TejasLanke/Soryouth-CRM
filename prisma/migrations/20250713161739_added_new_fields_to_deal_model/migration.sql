-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "dealFor" TEXT,
ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "FollowUp" ADD COLUMN     "dealId" TEXT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "totalDealValue" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
