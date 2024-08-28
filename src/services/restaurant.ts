import { eq } from "drizzle-orm";
import { logger } from "@/utils/logger";
import db from "@/db/db";
import {
	restaurantsTable,
	type RestaurantInsert,
	type RestaurantSelect,
} from "@/db/schema";

class RestaurantService {
	async createRestaurant(restaurant: RestaurantInsert) {
		try {
			const [restaurantId] = await db
				.insert(restaurantsTable)
				.values(restaurant)
				.returning();
			logger.info(`Created restaurant with ID: ${restaurantId}`);
			return restaurantId;
		} catch (error) {
			logger.error("Error creating restaurant:", error);
			throw new Error("Could not create restaurant");
		}
	}

	async getRestaurantById(id: number): Promise<RestaurantSelect | undefined> {
		try {
			const restaurant = await db
				.select()
				.from(restaurantsTable)
				.where(eq(restaurantsTable.id, id))
				.limit(1);
			logger.info(`Fetched restaurant with ID: ${id}`);
			return restaurant[0];
		} catch (error) {
			logger.error(`Error fetching restaurant with ID ${id}:`, error);
			throw new Error("Could not fetch restaurant");
		}
	}

	async getRestaurantByPhone(
		phone: string,
	): Promise<RestaurantSelect | undefined> {
		try {
			const restaurant = await db
				.select()
				.from(restaurantsTable)
				.where(eq(restaurantsTable.phone, phone))
				.limit(1);
			logger.info(`Fetched restaurant with Phone #: ${phone}`);
			return restaurant[0];
		} catch (error) {
			logger.error(`Error fetching restaurant with Phone # ${phone}:`, error);
			throw new Error("Could not fetch restaurant");
		}
	}

	async getAllRestaurants(): Promise<RestaurantSelect[]> {
		try {
			db.select;
			const restaurants = await db.select().from(restaurantsTable);
			logger.info("Fetched all restaurants");
			return restaurants;
		} catch (error) {
			logger.error("Error fetching all restaurants:", error);
			throw new Error("Could not fetch restaurants");
		}
	}

	async updateRestaurant(id: number, restaurant: RestaurantInsert) {
		try {
			const existingRestaurant = await this.getRestaurantById(id);
			if (!existingRestaurant) {
				logger.warn(`Restaurant with ID ${id} not found for update`);
				throw new Error("Restaurant not found");
			}
			await db
				.update(restaurantsTable)
				.set(restaurant)
				.where(eq(restaurantsTable.id, id));
			logger.info(`Updated restaurant with ID: ${id}`);
		} catch (error) {
			logger.error(`Error updating restaurant with ID ${id}:`, error);
			throw new Error("Could not update restaurant");
		}
	}

	async deleteRestaurant(id: number) {
		try {
			const existingRestaurant = await this.getRestaurantById(id);
			if (!existingRestaurant) {
				logger.warn(`Restaurant with ID ${id} not found for deletion`);
				throw new Error("Restaurant not found");
			}
			await db.delete(restaurantsTable).where(eq(restaurantsTable.id, id));
			logger.info(`Deleted restaurant with ID: ${id}`);
		} catch (error) {
			logger.error(`Error deleting restaurant with ID ${id}:`, error);
			throw new Error("Could not delete restaurant");
		}
	}
}

export default RestaurantService;
