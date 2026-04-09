CREATE TABLE "platform_roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid,
  "role" varchar,
  "created_at" timestamp DEFAULT NOW(),
  CONSTRAINT "fk_platform_roles_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE UNIQUE INDEX "ux_platform_roles_user_id_role" ON "platform_roles" ("user_id", "role");