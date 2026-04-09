CREATE TABLE "archived_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid,
  "org_id" uuid,
  "device_id" varchar,
  "user_agent" varchar,
  "ip_address" varchar,
  "version" int,
  "is_active" boolean,
  "last_activity_at" timestamp,
  "created_at" timestamp,
  "expires_at" timestamp,
  "archived_at" timestamp DEFAULT NOW()
);

CREATE INDEX "idx_archived_sessions_user_id" ON "archived_sessions" ("user_id");
CREATE INDEX "idx_archived_sessions_archived_at" ON "archived_sessions" ("archived_at");
CREATE INDEX "idx_archived_sessions_org_id" ON "archived_sessions" ("org_id");