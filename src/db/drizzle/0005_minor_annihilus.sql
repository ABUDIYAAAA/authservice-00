ALTER TABLE "organization_clients" ADD COLUMN "webhook_url" varchar(500);--> statement-breakpoint
ALTER TABLE "organization_clients" ADD COLUMN "webhook_secret_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "organization_clients" ADD COLUMN "webhook_secret_ciphertext" text;--> statement-breakpoint
ALTER TABLE "organization_clients" ADD COLUMN "webhook_secret_suffix" varchar(16);--> statement-breakpoint
ALTER TABLE "organization_clients" ADD COLUMN "webhook_enabled" boolean DEFAULT false NOT NULL;