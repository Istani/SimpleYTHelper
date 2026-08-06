-- Persist separate full-sync success and failure facts. A failure never overwrites a verified successful snapshot.
ALTER TABLE "discord_guild"
  ADD COLUMN "last_full_sync_at" TIMESTAMPTZ(6),
  ADD COLUMN "last_full_sync_failed_at" TIMESTAMPTZ(6),
  ADD COLUMN "last_full_sync_error" TEXT;

-- Store token-safe administrative facts for Discord bot configuration changes.
CREATE TABLE "discord_bot_admin_audit" (
  "id" UUID NOT NULL,
  "bot_id" TEXT NOT NULL,
  "actor_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "details" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "discord_bot_admin_audit_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "discord_bot_admin_audit_bot_id_fkey"
    FOREIGN KEY ("bot_id") REFERENCES "discord_bot_registration"("bot_id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "discord_bot_admin_audit_bot_created_idx"
  ON "discord_bot_admin_audit"("bot_id", "created_at");
CREATE INDEX "discord_bot_admin_audit_actor_created_idx"
  ON "discord_bot_admin_audit"("actor_id", "created_at");
