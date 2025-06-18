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
    "status" TEXT NOT NULL DEFAULT 'draft',
    "ai_analysis" TEXT,
    "generated_article" TEXT,
    "published_article" TEXT,
    "description" TEXT,
    "urls" TEXT,
    "notes" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_knowledge" ("ai_analysis", "category", "content", "created_at", "generated_article", "id", "published_article", "source_type", "source_url", "status", "tags", "title", "updated_at") SELECT "ai_analysis", "category", "content", "created_at", "generated_article", "id", "published_article", "source_type", "source_url", "status", "tags", "title", "updated_at" FROM "knowledge";
DROP TABLE "knowledge";
ALTER TABLE "new_knowledge" RENAME TO "knowledge";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
