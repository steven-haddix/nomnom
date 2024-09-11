import { relations } from "drizzle-orm";
import {
	pgEnum,
	pgTable,
	serial,
	varchar,
	integer,
	timestamp,
	text,
	decimal,
	jsonb,
} from "drizzle-orm/pg-core";
import { enumToPgEnum } from "@/db/utility";

export const workspacesTable = pgTable("workspaces", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
});

export const usersTable = pgTable("users", {
	id: serial("id").primaryKey(),
	workspaceId: integer("workspace_id").references(() => workspacesTable.id),
	email: varchar("email", { length: 255 }).notNull().unique(),
	role: varchar("role", { length: 20 }).notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.$onUpdate(() => new Date()),
});

export enum CommPlatform {
	TWILIO = "twilio",
}

export const commPlatformEnum = pgEnum(
	"comm_platform",
	enumToPgEnum(CommPlatform),
);

export const commAccountsTable = pgTable("comm_accounts", {
	id: serial("id").primaryKey(),
	workspaceId: integer("workspace_id").references(() => workspacesTable.id),
	platform: commPlatformEnum("comm_platform").notNull(),
	accountId: varchar("account_id", { length: 255 }).notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.$onUpdate(() => new Date()),
});

export const commNumbersTable = pgTable("comm_numbers", {
	id: serial("id").primaryKey(),
	accountId: integer("account_id").references(() => commAccountsTable.id),
	number: varchar("number", { length: 20 }).notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.$onUpdate(() => new Date()),
});

// Define the Restaurants table
export const restaurantsTable = pgTable("restaurants", {
	id: serial("id").primaryKey(),
	ownerId: integer("owner_id").references(() => usersTable.id),
	commNumberId: integer("comm_number_id").references(() => commNumbersTable.id),
	name: varchar("name", { length: 255 }).notNull(),
	address: varchar("address", { length: 255 }),
	phone: varchar("phone", { length: 20 }),
	altPhone: varchar("alt_phone", { length: 20 }),
	website: varchar("website", { length: 255 }),
	operatingHours: jsonb("operating_hours"),
	cuisineType: varchar("cuisine_type", { length: 50 }),
	deliveryOptions: varchar("delivery_options", { length: 100 }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.$onUpdate(() => new Date()),
});

// Define the Menus table
export const menusTable = pgTable("menus", {
	id: serial("id").primaryKey(),
	restaurantId: integer("restaurant_id").references(() => restaurantsTable.id),
	name: varchar("name", { length: 255 }),
	description: text("description"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.$onUpdate(() => new Date()),
});

// Define the Menu_Items table
export const menuItemsTable = pgTable("menu_items", {
	id: serial("id").primaryKey(),
	menuId: integer("menu_id").references(() => menusTable.id),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	price: decimal("price", { precision: 10, scale: 2 }),
	imageUrl: varchar("image_url", { length: 255 }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.$onUpdate(() => new Date()),
});

// Define the relationships
export const usersRelations = relations(usersTable, ({ many, one }) => ({
	restaurants: many(restaurantsTable),
	workspace: one(workspacesTable, {
		fields: [usersTable.workspaceId],
		references: [workspacesTable.id],
	}),
}));

export const workspacesRelations = relations(workspacesTable, ({ many }) => ({
	users: many(usersTable),
}));

export const restaurantsRelations = relations(
	restaurantsTable,
	({ one, many }) => ({
		owner: one(usersTable, {
			fields: [restaurantsTable.ownerId],
			references: [usersTable.id],
		}),
		menus: many(menusTable),
		commNumber: one(commNumbersTable, {
			// Optional relationship
			fields: [restaurantsTable.commNumberId],
			references: [commNumbersTable.id],
		}),
	}),
);

export const menusRelations = relations(menusTable, ({ one, many }) => ({
	restaurant: one(restaurantsTable, {
		fields: [menusTable.restaurantId],
		references: [restaurantsTable.id],
	}),
	menuItems: many(menuItemsTable),
}));

export const commAccountsRelations = relations(
	commAccountsTable,
	({ one, many }) => ({
		workspace: one(workspacesTable, {
			fields: [commAccountsTable.workspaceId],
			references: [workspacesTable.id],
		}),
		commNumbers: many(commNumbersTable),
	}),
);

export const commNumbersRelations = relations(commNumbersTable, ({ one }) => ({
	account: one(commAccountsTable, {
		fields: [commNumbersTable.accountId],
		references: [commAccountsTable.id],
	}),
}));

// Define the models
export type UserSelect = typeof usersTable.$inferSelect;
export type UserInsert = typeof usersTable.$inferInsert;
export type RestaurantSelect = typeof restaurantsTable.$inferSelect;
export type RestaurantInsert = typeof restaurantsTable.$inferInsert;
export type MenuSelect = typeof menusTable.$inferSelect;
export type MenuInsert = typeof menusTable.$inferInsert;
export type MenuItemSelect = typeof menuItemsTable.$inferSelect;
export type MenuItemInsert = typeof menuItemsTable.$inferInsert;

export type CommAccountSelect = typeof commAccountsTable.$inferSelect;
export type CommAccountInsert = typeof commAccountsTable.$inferInsert;
export type CommNumberSelect = typeof commNumbersTable.$inferSelect;
export type CommNumberInsert = typeof commNumbersTable.$inferInsert;
