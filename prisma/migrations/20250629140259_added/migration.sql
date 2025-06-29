-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('LEAD_STATUS', 'LEAD_SOURCE', 'CLIENT_STATUS');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Admin', 'TechnoSales', 'OfficeAdmin', 'Designing', 'Procurement', 'ProjectManager', 'LiasoningExecutive', 'OperationAndMaintainance');

-- CreateTable
CREATE TABLE "CustomSetting" (
    "id" TEXT NOT NULL,
    "type" "SettingType" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomSetting_type_name_key" ON "CustomSetting"("type", "name");
