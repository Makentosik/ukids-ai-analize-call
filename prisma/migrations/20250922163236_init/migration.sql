-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "calls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "employeeName" TEXT NOT NULL,
    "managerName" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "callText" TEXT,
    "initiatedBy" TEXT
);

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "checklist_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "evaluationType" TEXT NOT NULL DEFAULT 'SCALE_1_10',
    CONSTRAINT "checklist_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "checklist_templates" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "call_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "callId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "requestedById" TEXT,
    "commentText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "n8nResponse" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysisResults" JSONB,
    "completedAt" DATETIME,
    CONSTRAINT "call_reviews_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "call_reviews_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "checklist_templates" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "call_reviews_callId_fkey" FOREIGN KEY ("callId") REFERENCES "calls" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
