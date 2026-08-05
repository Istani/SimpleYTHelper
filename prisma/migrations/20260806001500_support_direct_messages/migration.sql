-- AlterTable
ALTER TABLE "discord_channel" ALTER COLUMN "guild_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "discord_message" ALTER COLUMN "guild_id" DROP NOT NULL;
