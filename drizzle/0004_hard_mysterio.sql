DO $$ BEGIN
 CREATE TYPE "public"."comm_platform" AS ENUM('twilio');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comm_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"comm_platform" "comm_platform" NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comm_numbers" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer,
	"number" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comm_accounts" ADD CONSTRAINT "comm_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comm_numbers" ADD CONSTRAINT "comm_numbers_account_id_comm_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."comm_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
