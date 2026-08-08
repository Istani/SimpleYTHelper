-- One registration table owns credentials for both official bots and selfbots.
CREATE TYPE "discord_account_kind" AS ENUM ('bot', 'selfbot');

ALTER TABLE "discord_bot_registration"
  ADD COLUMN "account_kind" "discord_account_kind" NOT NULL DEFAULT 'bot';

CREATE INDEX "discord_bot_registration_account_kind_is_active_idx"
  ON "discord_bot_registration"("account_kind", "is_active");

-- A source observation captures what a particular account actually saw. It prevents
-- a visibility gap from one account being interpreted as a global deletion.
CREATE TABLE "discord_source_observation" (
  "id" UUID NOT NULL,
  "source_id" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "observed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "discord_source_observation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "discord_source_observation_source_id_fkey"
    FOREIGN KEY ("source_id") REFERENCES "discord_bot_registration"("bot_id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "discord_source_observation_source_id_entity_type_entity_id_key"
  ON "discord_source_observation"("source_id", "entity_type", "entity_id");
CREATE INDEX "discord_source_observation_entity_type_entity_id_observed_at_idx"
  ON "discord_source_observation"("entity_type", "entity_id", "observed_at");

-- Discord scheduled server events are canonical inbound data; no outbound action is implied.
CREATE TABLE "discord_scheduled_event" (
  "scheduled_event_id" TEXT NOT NULL,
  "guild_id" TEXT NOT NULL,
  "channel_id" TEXT,
  "creator_id" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "scheduled_start_at" TIMESTAMPTZ(6),
  "scheduled_end_at" TIMESTAMPTZ(6),
  "status" INTEGER NOT NULL,
  "entity_type" INTEGER NOT NULL,
  "image" TEXT,
  "deleted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "discord_scheduled_event_pkey" PRIMARY KEY ("scheduled_event_id"),
  CONSTRAINT "discord_scheduled_event_guild_id_fkey"
    FOREIGN KEY ("guild_id") REFERENCES "discord_guild"("guild_id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "discord_scheduled_event_guild_id_deleted_at_scheduled_start_at_idx"
  ON "discord_scheduled_event"("guild_id", "deleted_at", "scheduled_start_at");
