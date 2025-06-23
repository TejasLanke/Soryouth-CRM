/*
  Warnings:

  - You are about to drop the column `followUpCount` on the `FollowUp` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FollowUp" DROP COLUMN "followUpCount";

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "followUpCount" INTEGER NOT NULL DEFAULT 0;
