-- CreateTable
CREATE TABLE "oauth_provider_configuration" (
    "provider" "connected_account_provider" NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_secret_ciphertext" TEXT NOT NULL,
    "redirect_uri" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "rotated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "oauth_provider_configuration_pkey" PRIMARY KEY ("provider")
);

-- CreateTable
CREATE TABLE "oauth_provider_configuration_audit" (
    "id" UUID NOT NULL,
    "provider" "connected_account_provider" NOT NULL,
    "actor_id" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_provider_configuration_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "oauth_provider_configuration_audit_provider_created_idx" ON "oauth_provider_configuration_audit"("provider", "created_at");

-- AddForeignKey
ALTER TABLE "oauth_provider_configuration_audit" ADD CONSTRAINT "oauth_provider_configuration_audit_provider_fkey" FOREIGN KEY ("provider") REFERENCES "oauth_provider_configuration"("provider") ON DELETE CASCADE ON UPDATE CASCADE;
