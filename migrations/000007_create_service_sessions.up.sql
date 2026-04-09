CREATE TABLE "service_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" uuid,
  "service_id" uuid,
  "is_logged_out" boolean DEFAULT false,
  "created_at" timestamp DEFAULT NOW(),
  CONSTRAINT "fk_service_sessions_session_id" FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  CONSTRAINT "fk_service_sessions_service_id" FOREIGN KEY ("service_id") REFERENCES "services" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE UNIQUE INDEX "ux_service_sessions_session_id_service_id" ON "service_sessions" ("session_id", "service_id");
CREATE INDEX "idx_service_sessions_service_id" ON "service_sessions" ("service_id");
CREATE INDEX "idx_service_sessions_is_logged_out" ON "service_sessions" ("is_logged_out");