import db from "@/db/db";
import {
	workspacesTable,
	usersTable,
	restaurantsTable,
	menusTable,
	menuItemsTable,
	commNumbersTable,
	commAccountsTable,
	CommPlatform,
} from "@/db/schema";
import { C } from "@upstash/redis/zmscore-uDFFyCiZ";

const workspaces = [
	{
		id: 1,
		name: "Gourmet Food Group",
		description: "A workspace for the Gourmet Food Group team",
	},
];

// Create mock User data
const users = [
	{
		id: 1,
		email: "john.doe@demorestaurant.com",
		role: "owner",
		workspaceId: 1,
	},
	{
		id: 2,
		email: "jane.smith@demorestaurant.com",
		role: "employee",
		workspaceId: 1,
	},
];

const commAccounts = [
	{
		id: 1,
		workspaceId: 1, // Reference to workspace ID
		platform: CommPlatform.TWILIO,
		accountId: "AC1234567890abcdef1234567890abcdef", // Twilio Account ID
	},
];

const commNumbers = [
	{
		id: 1,
		accountId: 1, // Assuming the communication account ID is 1
		number: "+1234567890", // Twilio Number
	},
];

// Create mock Restaurant data
const restaurants = [
	{
		id: 1,
		name: "The Gourmet Kitchen",
		ownerId: 1, // Assuming the user ID of the owner is 1
		address: "123 Culinary Avenue, Flavor Town",
		phone: "(123) 456-7890",
		website: "https://thegourmetkitchen.com",
		operatingHours: { Monday: "9:00 AM - 9:00 PM", Sunday: "Closed" },
		cuisineType: "Fusion",
		deliveryOptions: "Dine-in, Takeaway, Delivery",
	},
];

// Create mock Menu data
const menus = [
	{
		id: 1,
		restaurantId: 1, // Assuming the restaurant ID is 1
		name: "Lunch Menu",
		description: "A delightful selection to satisfy your midday cravings.",
	},
	{
		id: 2,
		restaurantId: 1, // Assuming the restaurant ID is 1
		name: "Dinner Menu",
		description:
			"An exquisite variety of dishes to end your day on a high note.",
	},
];

// Create mock Menu Items data
const menuItems = [
	{
		id: 1,
		menuId: 1, // Lunch Menu
		name: "Vegan Buddha Bowl",
		description:
			"A nourishing blend of quinoa, fresh veggies, and tahini dressing.",
		price: "12.99",
		imageUrl: "https://example.com/images/vegan-buddha-bowl.jpg",
	},
	{
		id: 2,
		menuId: 1, // Lunch Menu
		name: "Grilled Chicken Sandwich",
		description: "Juicy grilled chicken with lettuce, tomato, and basil pesto.",
		price: "10.99",
		imageUrl: "https://example.com/images/grilled-chicken-sandwich.jpg",
	},
	{
		id: 3,
		menuId: 2, // Dinner Menu
		name: "Pan-Seared Salmon",
		description:
			"Fresh salmon fillet served with roasted vegetables and lemon butter sauce.",
		price: "18.99",
		imageUrl: "https://example.com/images/pan-seared-salmon.jpg",
	},
	{
		id: 4,
		menuId: 2, // Dinner Menu
		name: "Classic Beef Wellington",
		description:
			"Tender beef wrapped in puff pastry, served with a savory mushroom sauce.",
		price: "24.99",
		imageUrl: "https://example.com/images/classic-beef-wellington.jpg",
	},
];

async function seedDatabase() {
	try {
		for (const workspace of workspaces) {
			await db.insert(workspacesTable).values(workspace);
		}

		// Insert users
		for (const user of users) {
			await db.insert(usersTable).values(user);
		}

		// Insert restaurants
		for (const restaurant of restaurants) {
			await db.insert(restaurantsTable).values(restaurant);
		}

		// Insert menus
		for (const menu of menus) {
			await db.insert(menusTable).values(menu);
		}

		// Insert menu items
		for (const menuItem of menuItems) {
			await db.insert(menuItemsTable).values(menuItem);
		}

		// Insert communication accounts
		for (const commAccount of commAccounts) {
			await db.insert(commAccountsTable).values(commAccount);
		}

		// Insert communication numbers
		for (const commNumber of commNumbers) {
			await db.insert(commNumbersTable).values(commNumber);
		}

		console.log("Database seeded successfully.");
	} catch (error) {
		console.error("Error seeding the database:", error);
	}
}

// Run the seed function
seedDatabase().finally(() => process.exit());
