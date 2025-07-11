/*
  Warnings:

  - Added the required column `formData` to the `GeneratedDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `templateId` to the `GeneratedDocument` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GeneratedDocument" ADD COLUMN     "formData" TEXT NOT NULL,
ADD COLUMN     "templateId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
