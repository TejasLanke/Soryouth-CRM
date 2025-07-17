-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "navPath" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RolePermission_roleName_idx" ON "RolePermission"("roleName");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleName_navPath_key" ON "RolePermission"("roleName", "navPath");
