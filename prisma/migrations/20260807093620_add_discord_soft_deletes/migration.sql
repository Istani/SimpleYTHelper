-- AlterTable
ALTER TABLE "discord_channel" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "discord_guild" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "discord_guild_member" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "discord_role" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6);
