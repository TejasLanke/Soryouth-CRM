-- DropIndex
DROP INDEX "FollowUp_leadId_idx";

-- AlterTable
ALTER TABLE "FollowUp" ADD COLUMN     "clientId" TEXT,
ALTER COLUMN "leadId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL,
    "priority" TEXT,
    "assignedTo" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "kilowatt" DOUBLE PRECISION,
    "address" TEXT,
    "clientType" TEXT,
    "electricityBillUrl" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
