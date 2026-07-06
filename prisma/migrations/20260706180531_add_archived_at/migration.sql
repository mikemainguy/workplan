-- AlterTable
ALTER TABLE "ActionItem" ADD COLUMN "archivedAt" DATETIME;

-- AlterTable
ALTER TABLE "Interaction" ADD COLUMN "archivedAt" DATETIME;

-- AlterTable
ALTER TABLE "Person" ADD COLUMN "archivedAt" DATETIME;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "archivedAt" DATETIME;
