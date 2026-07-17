-- CreateTable
CREATE TABLE "Suggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "linkedEntityId" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiJobId" TEXT NOT NULL,
    "interactionId" TEXT NOT NULL,
    CONSTRAINT "Suggestion_aiJobId_fkey" FOREIGN KEY ("aiJobId") REFERENCES "AiJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Suggestion_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "dueDate" DATETIME,
    "priority" TEXT,
    "metadata" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "interactionId" TEXT,
    "projectId" TEXT,
    CONSTRAINT "ActionItem_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActionItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ActionItem" ("archivedAt", "createdAt", "description", "dueDate", "id", "interactionId", "metadata", "priority", "projectId", "status", "updatedAt") SELECT "archivedAt", "createdAt", "description", "dueDate", "id", "interactionId", "metadata", "priority", "projectId", "status", "updatedAt" FROM "ActionItem";
DROP TABLE "ActionItem";
ALTER TABLE "new_ActionItem" RENAME TO "ActionItem";
CREATE TABLE "new_Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "title" TEXT,
    "organization" TEXT,
    "notes" TEXT,
    "metadata" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Person" ("archivedAt", "createdAt", "email", "id", "metadata", "name", "notes", "organization", "title", "updatedAt") SELECT "archivedAt", "createdAt", "email", "id", "metadata", "name", "notes", "organization", "title", "updatedAt" FROM "Person";
DROP TABLE "Person";
ALTER TABLE "new_Person" RENAME TO "Person";
CREATE TABLE "new_Topic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Topic" ("archivedAt", "createdAt", "description", "id", "metadata", "name", "updatedAt") SELECT "archivedAt", "createdAt", "description", "id", "metadata", "name", "updatedAt" FROM "Topic";
DROP TABLE "Topic";
ALTER TABLE "new_Topic" RENAME TO "Topic";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
