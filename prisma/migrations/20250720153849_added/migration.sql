-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "amcEffectiveDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "GeneralTask" ADD COLUMN     "amcTaskId" TEXT,
ADD COLUMN     "dealId" TEXT;

-- AddForeignKey
ALTER TABLE "GeneralTask" ADD CONSTRAINT "GeneralTask_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
