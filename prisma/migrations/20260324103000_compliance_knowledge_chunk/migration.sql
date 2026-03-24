-- CreateTable
CREATE TABLE "ComplianceKnowledgeChunk" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceKnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceKnowledgeChunk_source_chunkIndex_key" ON "ComplianceKnowledgeChunk"("source", "chunkIndex");

-- CreateIndex
CREATE INDEX "ComplianceKnowledgeChunk_source_idx" ON "ComplianceKnowledgeChunk"("source");
