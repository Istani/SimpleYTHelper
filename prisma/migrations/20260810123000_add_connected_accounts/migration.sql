-- CreateEnum
CREATE TYPE "connected_account_provider" AS ENUM ('discord', 'twitch', 'youtube');

-- CreateTable
CREATE TABLE "connected_account" (
    "id" UUID NOT NULL,
    "web_user_id" TEXT NOT NULL,
    "provider" "connected_account_provider" NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "access_token_ciphertext" TEXT NOT NULL,
    "refresh_token_ciphertext" TEXT,
    "token_expires_at" TIMESTAMPTZ(6),
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "connected_account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "connected_account_web_user_provider_idx" ON "connected_account"("web_user_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "connected_account_web_user_id_provider_provider_account_id_key" ON "connected_account"("web_user_id", "provider", "provider_account_id");

-- AddForeignKey
ALTER TABLE "connected_account" ADD CONSTRAINT "connected_account_web_user_id_fkey" FOREIGN KEY ("web_user_id") REFERENCES "web_user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
