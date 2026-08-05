-- CreateTable
CREATE TABLE "discord_guild" (
    "guild_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "owner_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "discord_guild_pkey" PRIMARY KEY ("guild_id")
);

-- CreateTable
CREATE TABLE "discord_user" (
    "user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "discriminator" TEXT,
    "global_name" TEXT,
    "avatar" TEXT,
    "is_bot" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "discord_user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "discord_channel" (
    "channel_id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "topic" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "parent_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "discord_channel_pkey" PRIMARY KEY ("channel_id")
);

-- CreateTable
CREATE TABLE "discord_role" (
    "role_id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" INTEGER NOT NULL DEFAULT 0,
    "hoist" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "permissions" TEXT NOT NULL,
    "managed" BOOLEAN NOT NULL DEFAULT false,
    "mentionable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "discord_role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "discord_message" (
    "message_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "discord_message_pkey" PRIMARY KEY ("message_id")
);

-- CreateIndex
CREATE INDEX "discord_channel_guild_idx" ON "discord_channel"("guild_id");

-- CreateIndex
CREATE INDEX "discord_role_guild_idx" ON "discord_role"("guild_id");

-- CreateIndex
CREATE INDEX "discord_message_channel_idx" ON "discord_message"("guild_id", "channel_id");

-- CreateIndex
CREATE INDEX "discord_message_author_idx" ON "discord_message"("author_id");

-- AddForeignKey
ALTER TABLE "discord_channel" ADD CONSTRAINT "discord_channel_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "discord_guild"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discord_role" ADD CONSTRAINT "discord_role_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "discord_guild"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discord_message" ADD CONSTRAINT "discord_message_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "discord_guild"("guild_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discord_message" ADD CONSTRAINT "discord_message_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "discord_channel"("channel_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discord_message" ADD CONSTRAINT "discord_message_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "discord_user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
