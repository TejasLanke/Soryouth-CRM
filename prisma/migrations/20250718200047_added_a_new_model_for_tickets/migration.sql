/*
  Warnings:

  - Added the required column `address` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientName` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mobileNo` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "clientName" TEXT NOT NULL,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "mobileNo" TEXT NOT NULL;
