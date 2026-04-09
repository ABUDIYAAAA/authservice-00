CREATE TABLE "password_reset_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid,
  "token" varchar UNIQUE,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT NOW(),
  "used_at" timestamp,
  CONSTRAINT "fk_password_reset_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX "idx_password_reset_tokens_user_id" ON "password_reset_tokens" ("user_id");
CREATE INDEX "idx_password_reset_tokens_token" ON "password_reset_tokens" ("token");
CREATE INDEX "idx_password_reset_tokens_expires_at" ON "password_reset_tokens" ("expires_at");