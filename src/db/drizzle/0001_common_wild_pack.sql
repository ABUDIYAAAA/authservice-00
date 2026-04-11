CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event" varchar(120) NOT NULL,
	"category" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"severity" varchar(20) DEFAULT 'info' NOT NULL,
	"actor_user_id" uuid,
	"target_user_id" uuid,
	"org_id" uuid,
	"session_id" uuid,
	"request_id" varchar(100),
	"ip_address" varchar(45),
	"user_agent" text,
	"message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_logs_event" ON "audit_logs" USING btree ("event");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_category" ON "audit_logs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_status" ON "audit_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_actor_user_id" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_target_user_id" ON "audit_logs" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_request_id" ON "audit_logs" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" USING btree ("created_at");