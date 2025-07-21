-- CreateTable
CREATE TABLE "FinancialDocument" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "docxUrl" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "formData" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,

    CONSTRAINT "FinancialDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinancialDocument_pdfUrl_key" ON "FinancialDocument"("pdfUrl");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialDocument_docxUrl_key" ON "FinancialDocument"("docxUrl");

-- AddForeignKey
ALTER TABLE "FinancialDocument" ADD CONSTRAINT "FinancialDocument_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
