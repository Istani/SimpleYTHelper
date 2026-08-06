-- CreateEnum
CREATE TYPE "discord_message_media_kind" AS ENUM ('attachment', 'embed', 'sticker');

-- CreateTable
CREATE TABLE "discord_message_media" (
    "id" UUID NOT NULL,
    "message_id" TEXT NOT NULL,
    "kind" "discord_message_media_kind" NOT NULL,
    "position" INTEGER NOT NULL,
    "source_id" TEXT,
    "label" TEXT NOT NULL,
    "url" TEXT,
    "content_type" TEXT,
    "size_bytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "description" TEXT,
    "is_spoiler" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "discord_message_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discord_message_media_message_idx" ON "discord_message_media"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "discord_message_media_position_key" ON "discord_message_media"("message_id", "kind", "position");

-- AddForeignKey
ALTER TABLE "discord_message_media" ADD CONSTRAINT "discord_message_media_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "discord_message"("message_id") ON DELETE CASCADE ON UPDATE CASCADE;
