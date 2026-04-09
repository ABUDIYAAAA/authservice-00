CREATE TABLE "archived_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "token_type" varchar,
  "user_id" uuid,
  "session_id" uuid,
  "service_id" uuid,
  "expires_at" timestamp,
  "created_at" timestamp,
  "archived_at" timestamp DEFAULT NOW()
);

CREATE INDEX "idx_archived_tokens_user_id" ON "archived_tokens" ("user_id");
CREATE INDEX "idx_archived_tokens_archived_at" ON "archived_tokens" ("archived_at");
CREATE INDEX "idx_archived_tokens_session_id" ON "archived_tokens" ("session_id");
CREATE INDEX "idx_archived_tokens_service_id" ON "archived_tokens" ("service_id");
CREATE INDEX "idx_archived_tokens_token_type" ON "archived_tokens" ("token_type");