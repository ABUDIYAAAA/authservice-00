CREATE TABLE "user_service_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid,
  "service_id" uuid,
  "key" varchar,
  "value" text,
  "created_at" timestamp DEFAULT NOW(),
  CONSTRAINT "fk_user_service_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  CONSTRAINT "fk_user_service_profiles_service_id" FOREIGN KEY ("service_id") REFERENCES "services" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX "idx_user_service_profiles_user_id" ON "user_service_profiles" ("user_id");
CREATE INDEX "idx_user_service_profiles_service_id" ON "user_service_profiles" ("service_id");
CREATE INDEX "idx_user_service_profiles_user_service_key" ON "user_service_profiles" ("user_id", "service_id", "key");