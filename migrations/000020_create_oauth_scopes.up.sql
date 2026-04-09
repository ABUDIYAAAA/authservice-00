CREATE TABLE "oauth_scopes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "service_id" uuid,
  "name" varchar,
  "description" text,
  "is_sensitive" boolean DEFAULT false,
  "created_at" timestamp DEFAULT NOW(),
  CONSTRAINT "fk_oauth_scopes_service_id" FOREIGN KEY ("service_id") REFERENCES "services" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE UNIQUE INDEX "ux_oauth_scopes_service_id_name" ON "oauth_scopes" ("service_id", "name");