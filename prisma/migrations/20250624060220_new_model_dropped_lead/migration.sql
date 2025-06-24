-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "followUpCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "FollowUp" ADD COLUMN     "droppedLeadId" TEXT;

-- CreateTable
CREATE TABLE "DroppedLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL,
    "source" TEXT,
    "assignedTo" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastCommentText" TEXT,
    "lastCommentDate" TIMESTAMP(3),
    "nextFollowUpDate" TIMESTAMP(3),
    "nextFollowUpTime" TEXT,
    "kilowatt" DOUBLE PRECISION,
    "address" TEXT,
    "priority" TEXT,
    "clientType" TEXT,
    "electricityBillUrl" TEXT,
    "dropReason" TEXT NOT NULL,
    "dropComment" TEXT,
    "droppedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DroppedLead_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_droppedLeadId_fkey" FOREIGN KEY ("droppedLeadId") REFERENCES "DroppedLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
