-- CreateEnum
CREATE TYPE "ViewPermission" AS ENUM ('ALL', 'ASSIGNED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "viewPermission" "ViewPermission" NOT NULL DEFAULT 'ASSIGNED';
