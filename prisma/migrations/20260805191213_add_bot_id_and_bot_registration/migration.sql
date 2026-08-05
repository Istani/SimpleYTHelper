-- AlterTable
ALTER TABLE "discord_adapter_delivery" ADD COLUMN "bot_id" TEXT;

-- CreateTable
CREATE TABLE "discord_bot_registration" (
    "bot_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "discord_user_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "rotated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "discord_bot_registration_pkey" PRIMARY KEY ("bot_id")
);

-- DropIndex
DROP INDEX "adapter_delivery_ready_idx";

-- CreateIndex
CREATE INDEX "adapter_delivery_ready_idx" ON "discord_adapter_delivery"("bot_id", "status", "next_attempt_at", "created_at");
