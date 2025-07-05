/*
  Warnings:

  - You are about to drop the column `electricityBillUrl` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `electricityBillUrl` on the `DroppedLead` table. All the data in the column will be lost.
  - You are about to drop the column `electricityBillUrl` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `electricityBillFile` on the `SiteSurvey` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "electricityBillUrl",
ADD COLUMN     "electricityBillUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "DroppedLead" DROP COLUMN "electricityBillUrl",
ADD COLUMN     "electricityBillUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "electricityBillUrl",
ADD COLUMN     "electricityBillUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "SiteSurvey" DROP COLUMN "electricityBillFile",
ADD COLUMN     "electricityBillFiles" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Client_assignedToId_idx" ON "Client"("assignedToId");

-- CreateIndex
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- CreateIndex
CREATE INDEX "Client_createdAt_idx" ON "Client"("createdAt");

-- CreateIndex
CREATE INDEX "CustomSetting_type_idx" ON "CustomSetting"("type");

-- CreateIndex
CREATE INDEX "FollowUp_leadId_idx" ON "FollowUp"("leadId");

-- CreateIndex
CREATE INDEX "FollowUp_clientId_idx" ON "FollowUp"("clientId");

-- CreateIndex
CREATE INDEX "FollowUp_droppedLeadId_idx" ON "FollowUp"("droppedLeadId");

-- CreateIndex
CREATE INDEX "FollowUp_createdAt_idx" ON "FollowUp"("createdAt");

-- CreateIndex
CREATE INDEX "GeneratedDocument_documentType_idx" ON "GeneratedDocument"("documentType");

-- CreateIndex
CREATE INDEX "Lead_assignedToId_idx" ON "Lead"("assignedToId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Proposal_leadId_idx" ON "Proposal"("leadId");

-- CreateIndex
CREATE INDEX "Proposal_clientId_idx" ON "Proposal"("clientId");

-- CreateIndex
CREATE INDEX "Proposal_droppedLeadId_idx" ON "Proposal"("droppedLeadId");

-- CreateIndex
CREATE INDEX "SiteSurvey_droppedLeadId_idx" ON "SiteSurvey"("droppedLeadId");
