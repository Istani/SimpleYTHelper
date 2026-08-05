-- CreateTable
CREATE TABLE "discord_guild_member" (
    "guild_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nickname" TEXT,
    "joined_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "discord_guild_member_pkey" PRIMARY KEY ("guild_id","user_id")
);

-- CreateTable
CREATE TABLE "discord_member_role" (
    "guild_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "discord_member_role_pkey" PRIMARY KEY ("guild_id","user_id","role_id")
);

-- CreateIndex
CREATE INDEX "discord_guild_member_user_idx" ON "discord_guild_member"("user_id");

-- CreateIndex
CREATE INDEX "discord_member_role_role_idx" ON "discord_member_role"("role_id");

-- AddForeignKey
ALTER TABLE "discord_guild_member" ADD CONSTRAINT "discord_guild_member_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "discord_guild"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discord_guild_member" ADD CONSTRAINT "discord_guild_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "discord_user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discord_member_role" ADD CONSTRAINT "discord_member_role_guild_id_user_id_fkey" FOREIGN KEY ("guild_id", "user_id") REFERENCES "discord_guild_member"("guild_id", "user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discord_member_role" ADD CONSTRAINT "discord_member_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "discord_role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;
