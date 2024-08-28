// agentContextFactory.ts
import type { Business, AgentContext } from "@/types/interfaces";
import type RestaurantService from "@/services/restaurant";

export class AgentContextFactory {
	constructor(private restaurantService: RestaurantService) {}

	async createContext(
		callId?: string,
		to?: string,
		from?: string,
	): Promise<AgentContext> {
		let business: Business | undefined;
		let customerId: string | undefined;

		if (to) {
			// Assuming the 'to' number belongs to a business
			const restaurant = await this.restaurantService.getRestaurantByPhone(to);
			if (restaurant) {
				business = {
					id: restaurant.id.toString(),
					name: restaurant.name,
					address: restaurant.address,
					phone: restaurant.phone,
					type: "restaurant",
					operatingHours: restaurant.operatingHours as string,
				};
			}
		}

		if (from) {
			// Assuming the 'from' number belongs to a customer
			customerId = await this.getCustomerIdByPhoneNumber(from);
		}

		if (!business || !customerId) {
			throw new Error(
				"Unable to create agent context. Missing business or customer information.",
			);
		}

		const context: AgentContext = {
			callInfo: { callId: callId || "", to: to || "", from: from || "" },
			customer: {
				id: customerId,
				name: "unknown", // Retrieve customer name from a customer repository if needed
			},
			business,
		};

		return context;
	}

	private async getCustomerIdByPhoneNumber(
		phoneNumber: string,
	): Promise<string> {
		// Implement the logic to retrieve the customer ID based on the phone number
		// You can use a customer repository or a database query to fetch the customer ID
		// For simplicity, let's assume the phone number itself is the customer ID
		return phoneNumber;
	}
}
