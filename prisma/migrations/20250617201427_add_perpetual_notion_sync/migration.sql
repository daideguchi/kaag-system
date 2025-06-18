/*
  Warnings:

  - You are about to drop the column `category_id` on the `knowledge` table. All the data in the column will be lost.
  - You are about to drop the column `cron_expression` on the `schedules` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `schedules` table. All the data in the column will be lost.
  - Added the required column `cron_pattern` to the `schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task_type` to the `schedules` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "notion_references" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "knowledge_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "page_title" TEXT NOT NULL,
    "page_url" TEXT NOT NULL,
    "last_synced_at" DATETIME,
    "notion_updated_at" DATETIME,
    "auto_sync_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sync_frequency" TEXT NOT NULL DEFAULT 'daily',
    "content_hash" TEXT,
    "last_content_hash" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "notion_references_knowledge_id_fkey" FOREIGN KEY ("knowledge_id") REFERENCES "knowledge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notion_sync_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notion_reference_id" TEXT NOT NULL,
    "sync_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "changes_detected" BOOLEAN NOT NULL DEFAULT false,
    "content_changes" TEXT,
    "error_message" TEXT,
    "sync_duration_ms" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notion_sync_logs_notion_reference_id_fkey" FOREIGN KEY ("notion_reference_id") REFERENCES "notion_references" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "article_duplications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "original_article_id" TEXT NOT NULL,
    "duplicate_content_hash" TEXT NOT NULL,
    "similarity_score" REAL NOT NULL,
    "detected_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolution_action" TEXT,
    CONSTRAINT "article_duplications_original_article_id_fkey" FOREIGN KEY ("original_article_id") REFERENCES "articles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "article_generation_queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "knowledge_id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "scheduled_at" DATETIME,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "article_generation_queue_knowledge_id_fkey" FOREIGN KEY ("knowledge_id") REFERENCES "knowledge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_knowledge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_url" TEXT,
    "category" TEXT NOT NULL DEFAULT 'tech',
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'notion_referenced',
    "ai_analysis" TEXT,
    "generated_article" TEXT,
    "published_article" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_knowledge" ("content", "created_at", "id", "source_type", "source_url", "tags", "title", "updated_at") SELECT "content", "created_at", "id", "source_type", "source_url", "tags", "title", "updated_at" FROM "knowledge";
DROP TABLE "knowledge";
ALTER TABLE "new_knowledge" RENAME TO "knowledge";
CREATE TABLE "new_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cron_pattern" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "task_type" TEXT NOT NULL,
    "filters" TEXT,
    "last_run_at" DATETIME,
    "next_run_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_schedules" ("created_at", "id", "last_run_at", "name", "next_run_at", "updated_at") SELECT "created_at", "id", "last_run_at", "name", "next_run_at", "updated_at" FROM "schedules";
DROP TABLE "schedules";
ALTER TABLE "new_schedules" RENAME TO "schedules";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "notion_references_knowledge_id_key" ON "notion_references"("knowledge_id");
