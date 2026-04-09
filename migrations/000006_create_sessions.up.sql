CREATE TABLE "sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid,
  "org_id" uuid,
  "device_id" varchar,
  "user_agent" varchar,
  "ip_address" varchar,
  "version" int DEFAULT 1,
  "is_active" boolean DEFAULT true,
  "last_activity_at" timestamp,
  "created_at" timestamp DEFAULT NOW(),
  "expires_at" timestamp,
  CONSTRAINT "fk_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  CONSTRAINT "fk_sessions_org_id" FOREIGN KEY ("org_id") REFERENCES "organizations" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX "idx_sessions_user_id" ON "sessions" ("user_id");
CREATE INDEX "idx_sessions_org_id" ON "sessions" ("org_id");
CREATE INDEX "idx_sessions_active_expires_at" ON "sessions" ("is_active", "expires_at");
CREATE INDEX "idx_sessions_last_activity_at" ON "sessions" ("last_activity_at");