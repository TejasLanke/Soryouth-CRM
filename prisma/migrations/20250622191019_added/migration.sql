-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "lastCommentDate" TIMESTAMP(3),
ADD COLUMN     "lastCommentText" TEXT,
ADD COLUMN     "nextFollowUpDate" TIMESTAMP(3),
ADD COLUMN     "nextFollowUpTime" TEXT,
ADD COLUMN     "source" TEXT;
