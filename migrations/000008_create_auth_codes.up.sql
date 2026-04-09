CREATE TABLE "auth_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid,
  "session_id" uuid,
  "service_id" uuid,
  "code" varchar UNIQUE,
  "code_challenge" varchar,
  "code_challenge_method" varchar,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT NOW(),
  CONSTRAINT "fk_auth_codes_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  CONSTRAINT "fk_auth_codes_session_id" FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  CONSTRAINT "fk_auth_codes_service_id" FOREIGN KEY ("service_id") REFERENCES "services" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX "idx_auth_codes_user_id" ON "auth_codes" ("user_id");
CREATE INDEX "idx_auth_codes_session_id" ON "auth_codes" ("session_id");
CREATE INDEX "idx_auth_codes_service_id" ON "auth_codes" ("service_id");
CREATE INDEX "idx_auth_codes_expires_at" ON "auth_codes" ("expires_at");