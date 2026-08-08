CREATE TABLE "discord_channel_participant" (
  "channel_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "discord_channel_participant_pkey" PRIMARY KEY ("channel_id", "user_id"),
  CONSTRAINT "discord_channel_participant_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "discord_channel"("channel_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "discord_channel_participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "discord_user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "discord_channel_participant_user_idx" ON "discord_channel_participant"("user_id");
