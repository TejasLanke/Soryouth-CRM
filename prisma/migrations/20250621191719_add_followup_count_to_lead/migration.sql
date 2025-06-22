/*
  Warnings:

  - You are about to drop the column `followupCount` on the `FollowUp` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FollowUp" DROP COLUMN "followupCount";

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "followUpCount" INTEGER NOT NULL DEFAULT 0;
