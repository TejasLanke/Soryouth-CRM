-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL,
    "source" TEXT,
    "assignedTo" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastCommentText" TEXT,
    "lastCommentDate" TEXT,
    "nextFollowUpDate" TEXT,
    "nextFollowUpTime" TEXT,
    "kilowatt" DOUBLE PRECISION,
    "address" TEXT,
    "priority" TEXT,
    "dropReason" TEXT,
    "clientType" TEXT,
    "electricityBillUrl" TEXT,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);
