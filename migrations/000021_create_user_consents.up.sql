CREATE TABLE "user_consents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid,
  "service_id" uuid,
  "scopes" text[],
  "granted_at" timestamp DEFAULT NOW(),
  "expires_at" timestamp,
  "revoked_at" timestamp,
  CONSTRAINT "fk_user_consents_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  CONSTRAINT "fk_user_consents_service_id" FOREIGN KEY ("service_id") REFERENCES "services" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX "idx_user_consents_user_id_service_id" ON "user_consents" ("user_id", "service_id");
CREATE INDEX "idx_user_consents_service_id" ON "user_consents" ("service_id");
CREATE INDEX "idx_user_consents_revoked_at" ON "user_consents" ("revoked_at");