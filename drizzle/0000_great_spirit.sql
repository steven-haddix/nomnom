CREATE TABLE IF NOT EXISTS "Menu_Items" (
	"id" serial PRIMARY KEY NOT NULL,
	"menu_id" integer,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 2),
	"image_url" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Menus" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer,
	"name" varchar(255),
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Restaurants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner_id" integer,
	"address" varchar(255),
	"phone" varchar(20),
	"website" varchar(255),
	"operating_hours" jsonb,
	"cuisine_type" varchar(50),
	"delivery_options" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "Users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Menu_Items" ADD CONSTRAINT "Menu_Items_menu_id_Menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."Menus"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Menus" ADD CONSTRAINT "Menus_restaurant_id_Restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."Restaurants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Restaurants" ADD CONSTRAINT "Restaurants_owner_id_Users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."Users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
