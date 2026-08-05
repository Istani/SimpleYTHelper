CREATE TABLE "web_user" (
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roles" TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "web_user_pkey" PRIMARY KEY ("user_id")
);

CREATE UNIQUE INDEX "web_user_email_key" ON "web_user"("email");
