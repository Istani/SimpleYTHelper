-- CreateEnum
CREATE TYPE "community_outbox_status" AS ENUM ('pending', 'processing', 'accepted_by_adapter', 'failed');

-- CreateEnum
CREATE TYPE "discord_adapter_delivery_status" AS ENUM ('accepted', 'processing', 'sent', 'failed');

-- CreateTable
CREATE TABLE "community_outbox_event" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "community_outbox_status" NOT NULL DEFAULT 'pending',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lease_owner" TEXT,
    "lease_expires_at" TIMESTAMPTZ(6),
    "last_error_code" TEXT,
    "last_error_message" TEXT,
    "accepted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "community_outbox_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discord_adapter_delivery" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "discord_adapter_delivery_status" NOT NULL DEFAULT 'accepted',
    "accepted_at" TIMESTAMPTZ(6) NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMPTZ(6),
    "last_error_code" TEXT,
    "last_error_message" TEXT,
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "discord_adapter_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outbox_event_ready_idx" ON "community_outbox_event"("destination", "next_attempt_at", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "discord_adapter_delivery_event_id_key" ON "discord_adapter_delivery"("event_id");

-- CreateIndex
CREATE INDEX "adapter_delivery_ready_idx" ON "discord_adapter_delivery"("status", "next_attempt_at", "created_at");
