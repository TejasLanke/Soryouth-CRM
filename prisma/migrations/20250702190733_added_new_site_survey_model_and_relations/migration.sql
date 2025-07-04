-- CreateTable
CREATE TABLE "SiteSurvey" (
    "id" TEXT NOT NULL,
    "surveyNumber" TEXT NOT NULL,
    "consumerName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "consumerCategory" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "numberOfMeters" INTEGER NOT NULL,
    "meterRating" TEXT,
    "meterPhase" TEXT,
    "electricityAmount" DOUBLE PRECISION,
    "consumerLoadType" TEXT NOT NULL,
    "roofType" TEXT NOT NULL,
    "buildingHeight" TEXT NOT NULL,
    "shadowFreeArea" TEXT NOT NULL,
    "discom" TEXT NOT NULL,
    "sanctionedLoad" TEXT,
    "remark" TEXT,
    "electricityBillFile" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "leadId" TEXT,
    "clientId" TEXT,
    "droppedLeadId" TEXT,
    "surveyorId" TEXT NOT NULL,

    CONSTRAINT "SiteSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteSurvey_surveyNumber_key" ON "SiteSurvey"("surveyNumber");

-- CreateIndex
CREATE INDEX "SiteSurvey_leadId_idx" ON "SiteSurvey"("leadId");

-- CreateIndex
CREATE INDEX "SiteSurvey_clientId_idx" ON "SiteSurvey"("clientId");

-- CreateIndex
CREATE INDEX "SiteSurvey_surveyorId_idx" ON "SiteSurvey"("surveyorId");

-- AddForeignKey
ALTER TABLE "SiteSurvey" ADD CONSTRAINT "SiteSurvey_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSurvey" ADD CONSTRAINT "SiteSurvey_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSurvey" ADD CONSTRAINT "SiteSurvey_droppedLeadId_fkey" FOREIGN KEY ("droppedLeadId") REFERENCES "DroppedLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSurvey" ADD CONSTRAINT "SiteSurvey_surveyorId_fkey" FOREIGN KEY ("surveyorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
