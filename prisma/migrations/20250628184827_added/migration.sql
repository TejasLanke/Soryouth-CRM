-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "proposalNumber" TEXT NOT NULL,
    "templateId" TEXT,
    "name" TEXT NOT NULL,
    "clientType" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "capacity" DECIMAL(65,30) NOT NULL,
    "moduleType" TEXT NOT NULL,
    "moduleWattage" TEXT NOT NULL,
    "dcrStatus" TEXT NOT NULL,
    "inverterRating" DECIMAL(65,30) NOT NULL,
    "inverterQty" INTEGER NOT NULL,
    "ratePerWatt" DECIMAL(65,30) NOT NULL,
    "proposalDate" TIMESTAMP(3) NOT NULL,
    "baseAmount" DECIMAL(65,30) NOT NULL,
    "cgstAmount" DECIMAL(65,30) NOT NULL,
    "sgstAmount" DECIMAL(65,30) NOT NULL,
    "subtotalAmount" DECIMAL(65,30) NOT NULL,
    "finalAmount" DECIMAL(65,30) NOT NULL,
    "subsidyAmount" DECIMAL(65,30) NOT NULL,
    "pdfUrl" TEXT,
    "docxUrl" TEXT,
    "requiredSpace" DECIMAL(65,30),
    "generationPerDay" DECIMAL(65,30),
    "generationPerYear" DECIMAL(65,30),
    "unitRate" DECIMAL(65,30),
    "savingsPerYear" DECIMAL(65,30),
    "laKitQty" INTEGER,
    "acdbDcdbQty" INTEGER,
    "earthingKitQty" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT,
    "leadId" TEXT,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_proposalNumber_key" ON "Proposal"("proposalNumber");

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
