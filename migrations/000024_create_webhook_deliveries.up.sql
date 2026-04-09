CREATE TABLE "webhook_deliveries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_id" uuid,
  "service_id" uuid,
  "webhook_id" uuid,
  "request_payload" json,
  "response_body" text,
  "status" varchar,
  "http_status" int,
  "attempt_count" int DEFAULT 0,
  "last_attempt_at" timestamp,
  "created_at" timestamp DEFAULT NOW(),
  CONSTRAINT "fk_webhook_deliveries_event_id" FOREIGN KEY ("event_id") REFERENCES "audit_logs" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  CONSTRAINT "fk_webhook_deliveries_service_id" FOREIGN KEY ("service_id") REFERENCES "services" ("id") DEFERRABLE INITIALLY IMMEDIATE,
  CONSTRAINT "fk_webhook_deliveries_webhook_id" FOREIGN KEY ("webhook_id") REFERENCES "service_webhooks" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX "idx_webhook_deliveries_status" ON "webhook_deliveries" ("status");
CREATE INDEX "idx_webhook_deliveries_created_at" ON "webhook_deliveries" ("created_at");
CREATE INDEX "idx_webhook_deliveries_event_id" ON "webhook_deliveries" ("event_id");
CREATE INDEX "idx_webhook_deliveries_service_id" ON "webhook_deliveries" ("service_id");
CREATE INDEX "idx_webhook_deliveries_webhook_id" ON "webhook_deliveries" ("webhook_id");
CREATE INDEX "idx_webhook_deliveries_last_attempt_at" ON "webhook_deliveries" ("last_attempt_at");