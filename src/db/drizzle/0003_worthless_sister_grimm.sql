CREATE TYPE "public"."organization_client_provider" AS ENUM('google', 'github');--> statement-breakpoint
CREATE TABLE "organization_client_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"provider" "organization_client_provider" NOT NULL,
	"provider_client_id" varchar(255) NOT NULL,
	"provider_client_secret_hash" varchar(255) NOT NULL,
	"provider_client_secret_suffix" varchar(16) NOT NULL,
	"callback_url" varchar(500) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"authorized_origins" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_client_providers" ADD CONSTRAINT "organization_client_providers_client_id_organization_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."organization_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_client_providers" ADD CONSTRAINT "organization_client_providers_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_client_providers" ADD CONSTRAINT "organization_client_providers_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_clients" ADD CONSTRAINT "organization_clients_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_clients" ADD CONSTRAINT "organization_clients_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_clients" ADD CONSTRAINT "organization_clients_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_organization_client_providers_client_id" ON "organization_client_providers" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_client_providers_unique_provider_per_client_idx" ON "organization_client_providers" USING btree ("client_id","provider");--> statement-breakpoint
CREATE INDEX "idx_organization_clients_org_id" ON "organization_clients" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_clients_name_per_org_unique_idx" ON "organization_clients" USING btree ("org_id",lower("name"));