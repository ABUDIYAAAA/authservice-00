CREATE TABLE "permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "service_id" uuid,
  "name" varchar,
  "created_at" timestamp DEFAULT NOW(),
  CONSTRAINT "fk_permissions_service_id" FOREIGN KEY ("service_id") REFERENCES "services" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE UNIQUE INDEX "ux_permissions_service_id_name" ON "permissions" ("service_id", "name");