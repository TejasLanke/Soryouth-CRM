-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "punchInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "punchOutTime" TIMESTAMP(3),
    "punchInLocation" TEXT NOT NULL,
    "punchOutLocation" TEXT,
    "workDuration" INTEGER,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attendance_userId_punchInTime_idx" ON "Attendance"("userId", "punchInTime");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
