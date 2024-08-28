ALTER TABLE "Menu_Items" RENAME TO "menu_items";--> statement-breakpoint
ALTER TABLE "Menus" RENAME TO "menus";--> statement-breakpoint
ALTER TABLE "Restaurants" RENAME TO "restaurants";--> statement-breakpoint
ALTER TABLE "Users" RENAME TO "users";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "Users_email_unique";--> statement-breakpoint
ALTER TABLE "menu_items" DROP CONSTRAINT "Menu_Items_menu_id_Menus_id_fk";
--> statement-breakpoint
ALTER TABLE "menus" DROP CONSTRAINT "Menus_restaurant_id_Restaurants_id_fk";
--> statement-breakpoint
ALTER TABLE "restaurants" DROP CONSTRAINT "Restaurants_owner_id_Users_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "menus" ADD CONSTRAINT "menus_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");