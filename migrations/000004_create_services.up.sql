CREATE TABLE "services" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid,
  "name" varchar,
  "client_id" varchar UNIQUE,
  "client_secret" varchar,
  "public_key" text,
  "private_key" text,
  "redirect_uris" text[],
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT NOW(),
  CONSTRAINT "fk_services_org_id" FOREIGN KEY ("org_id") REFERENCES "organizations" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX "idx_services_org_id" ON "services" ("org_id");
CREATE INDEX "idx_services_is_active" ON "services" ("is_active");