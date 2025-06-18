-- CreateTable
CREATE TABLE "notion_integrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "access_token" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "workspace_name" TEXT NOT NULL,
    "workspace_icon" TEXT,
    "bot_id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT,
    "owner_name" TEXT,
    "owner_avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "token_expires_at" DATETIME,
    "last_used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "notion_integrations_workspace_id_key" ON "notion_integrations"("workspace_id");
