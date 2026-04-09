CREATE TABLE "oauth_connections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid,
  "provider" varchar,
  "provider_user_id" varchar,
  "provider_email" varchar,
  "access_token" text,
  "refresh_token" text,
  "token_expires_at" timestamp,
  "profile_data" json,
  "created_at" timestamp DEFAULT NOW(),
  "updated_at" timestamp DEFAULT NOW(),
  CONSTRAINT "fk_oauth_connections_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE UNIQUE INDEX "ux_oauth_connections_user_id_provider" ON "oauth_connections" ("user_id", "provider");
CREATE UNIQUE INDEX "ux_oauth_connections_provider_provider_user_id" ON "oauth_connections" ("provider", "provider_user_id");
CREATE INDEX "idx_oauth_connections_provider_email" ON "oauth_connections" ("provider_email");
CREATE INDEX "idx_oauth_connections_token_expires_at" ON "oauth_connections" ("token_expires_at");

CREATE TRIGGER trg_oauth_connections_set_updated_at
BEFORE UPDATE ON "oauth_connections"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();