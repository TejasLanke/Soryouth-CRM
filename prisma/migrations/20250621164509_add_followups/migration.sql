/*
  Warnings:

  - Added the required column `date` to the `FollowUp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FollowUp" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "time" TEXT;
