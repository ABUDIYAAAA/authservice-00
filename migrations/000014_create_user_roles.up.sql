CREATE TABLE "user_roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid,
  "service_id" uuid,
  "role_id" uuid,
  "created_at" timestamp DEFAULT NOW(),
  CONSTRAINT "fk_user_roles_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  CONSTRAINT "fk_user_roles_service_id" FOREIGN KEY ("service_id") REFERENCES "services" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  CONSTRAINT "fk_user_roles_role_id" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE UNIQUE INDEX "ux_user_roles_user_id_service_id_role_id" ON "user_roles" ("user_id", "service_id", "role_id");
CREATE INDEX "idx_user_roles_service_id" ON "user_roles" ("service_id");
CREATE INDEX "idx_user_roles_role_id" ON "user_roles" ("role_id");