/*
  Warnings:

  - You are about to alter the column `totalDealValue` on the `Client` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `dealValue` on the `Deal` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "totalDealValue" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Deal" ALTER COLUMN "dealValue" SET DATA TYPE DOUBLE PRECISION;
