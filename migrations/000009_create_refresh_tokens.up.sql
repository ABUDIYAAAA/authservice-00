CREATE TABLE "refresh_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" uuid UNIQUE,
  "token_hash" varchar UNIQUE,
  "jti" uuid,
  "is_revoked" boolean DEFAULT false,
  "replaced_by" uuid,
  "last_used_at" timestamp,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT NOW(),
  CONSTRAINT "fk_refresh_tokens_session_id" FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  CONSTRAINT "fk_refresh_tokens_replaced_by" FOREIGN KEY ("replaced_by") REFERENCES "refresh_tokens" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX "idx_refresh_tokens_jti" ON "refresh_tokens" ("jti");
CREATE INDEX "idx_refresh_tokens_is_revoked" ON "refresh_tokens" ("is_revoked");
CREATE INDEX "idx_refresh_tokens_expires_at" ON "refresh_tokens" ("expires_at");