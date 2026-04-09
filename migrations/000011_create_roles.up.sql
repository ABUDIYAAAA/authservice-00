CREATE TABLE "roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "service_id" uuid,
  "name" varchar,
  "description" text,
  "created_at" timestamp DEFAULT NOW(),
  CONSTRAINT "fk_roles_service_id" FOREIGN KEY ("service_id") REFERENCES "services" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE UNIQUE INDEX "ux_roles_service_id_name" ON "roles" ("service_id", "name");