// agentFactory.ts
import type { CallService } from "@/services/call.service";
import type { MessageService } from "@/services/message.service";
import { RestaurantAgent } from "@/agents/restaurant.agent";
import type { AgentContext } from "@/types/interfaces";

export class AgentFactory {
	constructor(
		private callService: CallService,
		private messageService: MessageService,
	) {}

	createAgent(context: AgentContext) {
		const { business } = context;

		switch (business.type) {
			case "restaurant":
				return new RestaurantAgent(
					this.callService,
					this.messageService,
					context,
				);
			case "hotel":
				throw new Error("Hotel agent not implemented");
			case "local_business":
				throw new Error("Local business agent not implemented");
			// Add more cases for other business types as needed
			default:
				throw new Error(`Unsupported business type: ${business.type}`);
		}
	}
}
