CREATE TABLE "email_verification_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid,
  "token" varchar UNIQUE,
  "email" varchar,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT NOW(),
  "used_at" timestamp,
  CONSTRAINT "fk_email_verification_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX "idx_email_verification_tokens_user_id" ON "email_verification_tokens" ("user_id");
CREATE INDEX "idx_email_verification_tokens_token" ON "email_verification_tokens" ("token");
CREATE INDEX "idx_email_verification_tokens_expires_at" ON "email_verification_tokens" ("expires_at");