CREATE TABLE IF NOT EXISTS "workspaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text
);
--> statement-breakpoint
ALTER TABLE "comm_accounts" DROP CONSTRAINT "comm_accounts_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "comm_accounts" ADD COLUMN "workspace_id" integer;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "comm_number_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "workspace_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comm_accounts" ADD CONSTRAINT "comm_accounts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_comm_number_id_comm_numbers_id_fk" FOREIGN KEY ("comm_number_id") REFERENCES "public"."comm_numbers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "comm_accounts" DROP COLUMN IF EXISTS "user_id";