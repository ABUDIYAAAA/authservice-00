CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid,
  "user_id" uuid,
  "session_id" uuid,
  "service_id" uuid,
  "action" varchar,
  "resource_type" varchar,
  "resource_id" uuid,
  "request_payload" json,
  "response_payload" json,
  "ip_address" varchar,
  "user_agent" varchar,
  "created_at" timestamp DEFAULT NOW(),
  CONSTRAINT "fk_audit_logs_org_id" FOREIGN KEY ("org_id") REFERENCES "organizations" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  CONSTRAINT "fk_audit_logs_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  CONSTRAINT "fk_audit_logs_session_id" FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  CONSTRAINT "fk_audit_logs_service_id" FOREIGN KEY ("service_id") REFERENCES "services" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX "idx_audit_logs_org_id" ON "audit_logs" ("org_id");
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs" ("user_id");
CREATE INDEX "idx_audit_logs_action" ON "audit_logs" ("action");
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" ("created_at");
CREATE INDEX "idx_audit_logs_session_id" ON "audit_logs" ("session_id");
CREATE INDEX "idx_audit_logs_service_id" ON "audit_logs" ("service_id");
CREATE INDEX "idx_audit_logs_resource_type_resource_id" ON "audit_logs" ("resource_type", "resource_id");