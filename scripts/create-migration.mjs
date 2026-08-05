import fs from 'node:fs';
import path from 'node:path';

const migrationName = process.argv[2] || 'migration';
const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
const dirName = `${timestamp}_${migrationName}`;
const migrationDir = path.join('prisma', 'migrations', dirName);

fs.mkdirSync(migrationDir, { recursive: true });

const sql = `
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
`;

fs.writeFileSync(path.join(migrationDir, 'migration.sql'), sql.trim() + '\n', 'utf-8');
console.log(`Created migration: ${dirName}`);
