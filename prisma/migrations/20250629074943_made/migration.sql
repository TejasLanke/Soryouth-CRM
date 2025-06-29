/*
  Warnings:

  - You are about to drop the column `assignedTo` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `assignedTo` on the `DroppedLead` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `DroppedLead` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `FollowUp` table. All the data in the column will be lost.
  - You are about to drop the column `taskForUser` on the `FollowUp` table. All the data in the column will be lost.
  - You are about to drop the column `assignedTo` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `Lead` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "assignedTo",
DROP COLUMN "createdBy",
ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "DroppedLead" DROP COLUMN "assignedTo",
DROP COLUMN "createdBy",
ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "FollowUp" DROP COLUMN "createdBy",
DROP COLUMN "taskForUser",
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "taskForUserId" TEXT;

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "assignedTo",
DROP COLUMN "createdBy",
ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'TechnoSales';

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DroppedLead" ADD CONSTRAINT "DroppedLead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DroppedLead" ADD CONSTRAINT "DroppedLead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_taskForUserId_fkey" FOREIGN KEY ("taskForUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
