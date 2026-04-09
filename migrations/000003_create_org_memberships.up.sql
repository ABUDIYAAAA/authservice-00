CREATE TABLE "org_memberships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid,
  "org_id" uuid,
  "role" varchar,
  "created_at" timestamp DEFAULT NOW(),
  CONSTRAINT "fk_org_memberships_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  CONSTRAINT "fk_org_memberships_org_id" FOREIGN KEY ("org_id") REFERENCES "organizations" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE UNIQUE INDEX "ux_org_memberships_user_id_org_id" ON "org_memberships" ("user_id", "org_id");
CREATE INDEX "idx_org_memberships_org_id" ON "org_memberships" ("org_id");