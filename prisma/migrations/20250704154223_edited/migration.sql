-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN     "droppedLeadId" TEXT;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_droppedLeadId_fkey" FOREIGN KEY ("droppedLeadId") REFERENCES "DroppedLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
