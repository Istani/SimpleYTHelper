-- The operator has explicitly selected central PostgreSQL storage for bot tokens.
-- Restrict direct database access; application APIs must never return this column.
ALTER TABLE "discord_bot_registration" RENAME COLUMN "token_hash" TO "token";
