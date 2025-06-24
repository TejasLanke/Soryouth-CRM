/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `phone` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'TechnoSales', 'Designing', 'Procurement', 'ProjectManager', 'LiasoningExecutive', 'OperationAndMaintainance');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'TechnoSales',
ALTER COLUMN "phone" SET NOT NULL;
