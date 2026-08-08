-- Align the applied source-observation table with its Prisma composite identity.
-- The original additive migration accidentally introduced an unused UUID primary key,
-- while the application consistently addresses observations by source/type/entity.
ALTER TABLE "discord_source_observation"
  DROP CONSTRAINT IF EXISTS "discord_source_observation_pkey";

DROP INDEX IF EXISTS "discord_source_observation_source_id_entity_type_entity_id_key";
DROP INDEX IF EXISTS "discord_source_observation_entity_type_entity_id_observed_at_idx";

ALTER TABLE "discord_source_observation"
  DROP COLUMN IF EXISTS "id";

ALTER TABLE "discord_source_observation"
  ADD CONSTRAINT "discord_source_observation_pkey"
  PRIMARY KEY ("source_id", "entity_type", "entity_id");

ALTER TABLE "discord_source_observation"
  DROP CONSTRAINT IF EXISTS "discord_source_observation_source_id_fkey";

ALTER TABLE "discord_source_observation"
  ADD CONSTRAINT "discord_source_observation_source_id_fkey"
  FOREIGN KEY ("source_id") REFERENCES "discord_bot_registration"("bot_id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "discord_source_observation_entity_idx"
  ON "discord_source_observation"("entity_type", "entity_id");
