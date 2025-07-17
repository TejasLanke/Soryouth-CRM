-- CreateTable
CREATE TABLE "GeneralTask" (
    "id" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "taskDate" TIMESTAMP(3) NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "GeneralTask_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GeneralTask" ADD CONSTRAINT "GeneralTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralTask" ADD CONSTRAINT "GeneralTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
