// agentService.ts
import type {
	AudioProcessingService,
	LanguageModelService,
	AgentService,
} from "../types/interfaces";
import type RestaurantService from "@/services/restaurant";
import type { RestaurantSelect } from "@/db/schema";
import { callRepository } from "@/kv/schema";
import { logger } from "@/utils/logger";

export class ConversationService {
	private restaurant: RestaurantSelect | undefined;
	private sessionId: string | null = null;
	private onSpeakingCallback: ((audio: AsyncGenerator<Buffer>) => void) | null =
		null;
	private isResponding = false;

	constructor(
		private audioProcessingService: AudioProcessingService,
		private languageModelService: LanguageModelService,
		private restaurantService: RestaurantService,
	) {
		logger.info("BasicSessionAgent initialized");
	}

	private async getRestaurant(phone: string) {
		this.restaurant = await this.restaurantService.getRestaurantByPhone(phone);

		return this;
	}

	private async getCustomer(phone: string) {
		// TODO: implement customer service
		return {
			name: "unknown",
			phone,
		};
	}

	async registerCall(
		callId: string,
		to: string,
		from: string,
		platform: string,
	) {
		await callRepository.save(callId, {
			callId,
			to,
			from,
			platform,
		});
		await callRepository.expire(callId, 3600);
	}

	async fetchCall(callId: string) {
		const call = await callRepository.fetch(callId);
		if (!call) {
			throw new Error("Call not found");
		}
		return call;
	}

	startCall(
		sessionId: string,
		onSpeaking: (audio: AsyncGenerator<Buffer>) => void,
	) {
		this.onSpeakingCallback = onSpeaking;
		this.sessionId = sessionId;

		this.audioProcessingService.createSession(
			this.sessionId,
			async (transcript: string) => {
				const restaurantInfo = this.parseRestaurant(this.restaurant);
				logger.info({ transcript, restaurantInfo }, "Transcript received");

				this.respondToCustomer(transcript);
			},
		);

		// initiate the conversation with the customer
		// TODO: in future move event to some kind of onReady hook with a communication service
		this.respondToCustomer("<call_started>caller unknown</call_started>");
	}

	handleCallAudio(audio: Buffer) {
		if (!this.sessionId) {
			throw new Error("No active listening session");
		}
		this.audioProcessingService.sendAudio(this.sessionId, audio);
	}

	async respondToCustomer(incomingEvent: string) {
		if (!this.sessionId) {
			throw new Error("No active listening session");
		}

		if (this.isResponding) {
			logger.debug({ msg: incomingEvent }, "Already responding to customer");
			return;
		}

		this.isResponding = true;
		const restaurantInfo = this.parseRestaurant(this.restaurant);

		const response = await this.languageModelService.getResponse(
			this.sessionId,
			incomingEvent,
			this.restaurant ? restaurantInfo : "",
		);

		const audio = this.audioProcessingService.synthesizeSpeech(response);
		this.onSpeakingCallback?.(audio);

		this.isResponding = false;
	}

	speak(text: string, onSpeaking: (audio: AsyncGenerator<Buffer>) => void) {
		const audio = this.audioProcessingService.synthesizeSpeech(text);
		onSpeaking?.(audio);
	}

	stopListening() {
		if (!this.sessionId) {
			throw new Error("No active listening session");
		}
		this.audioProcessingService.deleteSession(this.sessionId);
		this.sessionId = null;
		this.onSpeakingCallback = null;
	}

	private parseRestaurant(restaurant: RestaurantSelect | undefined): string {
		if (!restaurant) {
			return "I'm sorry, I couldn't find a restaurant with that ID";
		}

		return JSON.stringify({
			"Restaurant Name": restaurant.name,
			Address: restaurant.address,
			"Phone Number": restaurant.phone,
			Website: restaurant.website,
			Hours: restaurant.operatingHours,
			Cuisine: restaurant.cuisineType,
			Delivery: restaurant.deliveryOptions,
		});
	}
}
