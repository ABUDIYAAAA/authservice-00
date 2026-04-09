CREATE TABLE "access_token_blacklist" (
  "jti" uuid PRIMARY KEY,
  "session_id" uuid,
  "revoked_at" timestamp,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT NOW(),
  CONSTRAINT "fk_access_token_blacklist_session_id" FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX "idx_access_token_blacklist_session_id" ON "access_token_blacklist" ("session_id");
CREATE INDEX "idx_access_token_blacklist_expires_at" ON "access_token_blacklist" ("expires_at");