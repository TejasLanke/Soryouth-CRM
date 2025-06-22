/*
  Warnings:

  - The `lastCommentDate` column on the `Lead` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `nextFollowUpDate` column on the `Lead` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `followupOrTask` to the `FollowUp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FollowUp" ADD COLUMN     "followupOrTask" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "lastCommentDate",
ADD COLUMN     "lastCommentDate" TIMESTAMP(3),
DROP COLUMN "nextFollowUpDate",
ADD COLUMN     "nextFollowUpDate" TIMESTAMP(3);
