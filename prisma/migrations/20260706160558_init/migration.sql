-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "title" TEXT,
    "organization" TEXT,
    "notes" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "rawContent" TEXT,
    "parsedContent" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "projectId" TEXT,
    CONSTRAINT "Interaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "dueDate" DATETIME,
    "priority" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "interactionId" TEXT,
    "projectId" TEXT,
    CONSTRAINT "ActionItem_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActionItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InteractionPerson" (
    "interactionId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    PRIMARY KEY ("interactionId", "personId"),
    CONSTRAINT "InteractionPerson_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InteractionPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActionItemPerson" (
    "actionItemId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    PRIMARY KEY ("actionItemId", "personId"),
    CONSTRAINT "ActionItemPerson_actionItemId_fkey" FOREIGN KEY ("actionItemId") REFERENCES "ActionItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActionItemPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
