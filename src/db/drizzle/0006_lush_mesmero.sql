CREATE TYPE "public"."oauth_flow_type" AS ENUM('signin', 'signup');--> statement-breakpoint
CREATE TABLE "oauth_relogin_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"session_version" integer NOT NULL,
	"org_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"flow_type" "oauth_flow_type" NOT NULL,
	"client_context" varchar(255),
	"redirect_to" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_relogin_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"client_context" varchar(255),
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_client_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"first_signed_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_signed_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_clients" ADD COLUMN "redirect_uris" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_clients" ADD COLUMN "client_secret_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "organization_clients" ADD COLUMN "client_secret_ciphertext" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "client_id" uuid;--> statement-breakpoint
ALTER TABLE "oauth_relogin_challenges" ADD CONSTRAINT "oauth_relogin_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_relogin_challenges" ADD CONSTRAINT "oauth_relogin_challenges_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_relogin_challenges" ADD CONSTRAINT "oauth_relogin_challenges_client_id_organization_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."organization_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_relogin_requirements" ADD CONSTRAINT "oauth_relogin_requirements_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_relogin_requirements" ADD CONSTRAINT "oauth_relogin_requirements_client_id_organization_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."organization_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_relogin_requirements" ADD CONSTRAINT "oauth_relogin_requirements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_client_users" ADD CONSTRAINT "organization_client_users_client_id_organization_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."organization_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_client_users" ADD CONSTRAINT "organization_client_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_relogin_challenges_token_unique_idx" ON "oauth_relogin_challenges" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_oauth_relogin_challenges_expires_at" ON "oauth_relogin_challenges" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_relogin_requirements_unique_idx" ON "oauth_relogin_requirements" USING btree ("org_id","client_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_oauth_relogin_requirements_expires_at" ON "oauth_relogin_requirements" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_client_users_unique_idx" ON "organization_client_users" USING btree ("client_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_organization_client_users_client_id" ON "organization_client_users" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_organization_client_users_user_id" ON "organization_client_users" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_client_id_organization_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."organization_clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_sessions_client_id" ON "sessions" USING btree ("client_id");--> statement-breakpoint
ALTER TABLE "organization_client_providers" DROP COLUMN "provider_client_secret_suffix";--> statement-breakpoint
ALTER TABLE "organization_clients" DROP COLUMN "webhook_secret_suffix";