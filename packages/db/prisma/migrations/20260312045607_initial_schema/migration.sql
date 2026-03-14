-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('IDLE', 'SYNCING', 'DONE', 'ERROR');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('COLOR', 'TYPOGRAPHY', 'SPACING', 'RADIUS', 'SHADOW', 'OPACITY', 'OTHER');

-- CreateEnum
CREATE TYPE "TokenSource" AS ENUM ('FIGMA_VARIABLES', 'FIGMA_STYLES', 'INFERRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FigmaConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "figmaUserId" TEXT NOT NULL,
    "figmaEmail" TEXT NOT NULL,
    "figmaHandle" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FigmaConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignSystem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "figmaFileKey" TEXT NOT NULL,
    "figmaFileName" TEXT,
    "mcpToken" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishSlug" TEXT,
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'IDLE',
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FigmaSync" (
    "id" TEXT NOT NULL,
    "designSystemId" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'SYNCING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "componentsFound" INTEGER,
    "tokensFound" INTEGER,
    "thumbnailsUploaded" INTEGER,
    "errorMessage" TEXT,
    "figmaLastModified" TEXT,

    CONSTRAINT "FigmaSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "designSystemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Component" (
    "id" TEXT NOT NULL,
    "designSystemId" TEXT NOT NULL,
    "categoryId" TEXT,
    "figmaNodeId" TEXT NOT NULL,
    "figmaNodeType" TEXT NOT NULL,
    "figmaPageName" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "figmaDescription" TEXT,
    "variants" JSONB,
    "figmaProps" JSONB,
    "nodeTree" JSONB,
    "thumbnailUrl" TEXT,
    "thumbnailStoragePath" TEXT,
    "docDescription" JSONB,
    "docUsageNotes" JSONB,
    "dos" TEXT[],
    "donts" TEXT[],
    "customProps" JSONB,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "designSystemId" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "source" "TokenSource" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "rawValue" JSONB,
    "hexValue" TEXT,
    "figmaId" TEXT,
    "figmaVariableCollectionId" TEXT,
    "group" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FigmaConnection_userId_key" ON "FigmaConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DesignSystem_mcpToken_key" ON "DesignSystem"("mcpToken");

-- CreateIndex
CREATE UNIQUE INDEX "DesignSystem_publishSlug_key" ON "DesignSystem"("publishSlug");

-- CreateIndex
CREATE UNIQUE INDEX "DesignSystem_userId_slug_key" ON "DesignSystem"("userId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_designSystemId_slug_key" ON "Category"("designSystemId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Component_designSystemId_figmaNodeId_key" ON "Component"("designSystemId", "figmaNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Component_designSystemId_slug_key" ON "Component"("designSystemId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Token_designSystemId_slug_key" ON "Token"("designSystemId", "slug");

-- AddForeignKey
ALTER TABLE "FigmaConnection" ADD CONSTRAINT "FigmaConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignSystem" ADD CONSTRAINT "DesignSystem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FigmaSync" ADD CONSTRAINT "FigmaSync_designSystemId_fkey" FOREIGN KEY ("designSystemId") REFERENCES "DesignSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_designSystemId_fkey" FOREIGN KEY ("designSystemId") REFERENCES "DesignSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Component" ADD CONSTRAINT "Component_designSystemId_fkey" FOREIGN KEY ("designSystemId") REFERENCES "DesignSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Component" ADD CONSTRAINT "Component_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_designSystemId_fkey" FOREIGN KEY ("designSystemId") REFERENCES "DesignSystem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
