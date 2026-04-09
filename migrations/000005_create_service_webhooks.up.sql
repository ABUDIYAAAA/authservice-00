CREATE TABLE "service_webhooks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "service_id" uuid,
  "url" text,
  "secret" varchar,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT NOW(),
  CONSTRAINT "fk_service_webhooks_service_id" FOREIGN KEY ("service_id") REFERENCES "services" ("id") DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX "idx_service_webhooks_service_id" ON "service_webhooks" ("service_id");
CREATE INDEX "idx_service_webhooks_is_active" ON "service_webhooks" ("is_active");