CREATE TABLE "auth_code_scopes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "auth_code_id" uuid,
  "scope" varchar,
  CONSTRAINT "fk_auth_code_scopes_auth_code_id" FOREIGN KEY ("auth_code_id") REFERENCES "auth_codes" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX "idx_auth_code_scopes_auth_code_id" ON "auth_code_scopes" ("auth_code_id");
CREATE UNIQUE INDEX "ux_auth_code_scopes_auth_code_id_scope" ON "auth_code_scopes" ("auth_code_id", "scope");