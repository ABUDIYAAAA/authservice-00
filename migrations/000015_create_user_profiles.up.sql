CREATE TABLE "user_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid,
  "key" varchar,
  "value" text,
  "created_at" timestamp DEFAULT NOW(),
  CONSTRAINT "fk_user_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX "idx_user_profiles_user_id" ON "user_profiles" ("user_id");
CREATE INDEX "idx_user_profiles_user_id_key" ON "user_profiles" ("user_id", "key");