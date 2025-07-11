-- AlterEnum
ALTER TYPE "SettingType" ADD VALUE 'DOCUMENT_TYPE';

-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "placeholdersJson" TEXT;
