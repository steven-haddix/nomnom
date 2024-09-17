// restaurantAgent.service.ts
import type { CallService } from "@/services/call.service";
import type { MessageService } from "@/services/message.service";
import {
	getOpenAIResponse,
	getResponseStream,
	updateHistory,
} from "@/services/langchain";
import { logger } from "@/utils/logger";
import type { RestaurantSelect } from "@/db/schema";
import type { AgentContext } from "@/types/interfaces";
import { ToolFactory, type ToolsObject } from "./tool.factory";

export class RestaurantAgent {
	private tools: ToolsObject = ToolFactory.emptyTools;

	constructor(
		private callService: CallService,
		private messageService: MessageService,
		private context: AgentContext,
	) {
		if (context.callInfo?.callId) {
			this.subscribeToCall(context.callInfo.callId);
			this.callService.onCallStarted(this.handleCallStarted.bind(this));
			this.callService.onCallEnded(this.handleCallEnded.bind(this));
		}

		this.tools = new ToolFactory(this.messageService, this.callService, this.context).createRestaurantTools();
	}

	private subscribeToCall(callId: string) {
		this.callService.subscribeToTranscripts(
			callId,
			this.handleTranscript.bind(this),
		);
	}

	private async handleCallStarted(callId: string) {
		if (callId === this.context.callInfo?.callId) {
			const { callId, to, from } = this.context.callInfo;
			const sessionId = `${to}-${from}`;

			try {
				const restaurantInfo = this.getRestaurantInfo();
				const response = await getResponseStream(
					sessionId,
					`<call_started phone="${from}" />`,
					restaurantInfo,
					this.tools,
				);

				this.callService.speakToCallStream(callId, response);
			} catch (error) {
				logger.error("Error processing transcript:", error);
				this.callService.speakToCall(
					callId,
					"I apologize, there was an error processing your request. Please try again later.",
				);
			}
		}
	}

	private async handleCallEnded(callId: string) {
		if (callId === this.context.callInfo?.callId) {
			const { to, from } = this.context.callInfo;
			const sessionId = `${to}-${from}`;

			try {
				await updateHistory(sessionId, "<call_ended />");
			} catch (error) {
				logger.error("Error processing call ended event:", error);
			}
		}
	}

	private async handleTranscript(transcript: string) {
		if (!this.context.callInfo) {
			logger.error("No call information available in the context");
			return;
		}

		const { callId, to, from } = this.context.callInfo;
		const sessionId = `${to}-${from}`;

		try {
			const restaurantInfo = this.getRestaurantInfo();
			const response = await getOpenAIResponse(
				sessionId,
				`<call phone="${from}">${transcript}</call>`,
				restaurantInfo,
				this.tools,
			);
			this.callService.speakToCall(callId, response);
		} catch (error) {
			logger.error("Error processing transcript:", error);
			this.callService.speakToCall(
				callId,
				"I apologize, there was an error processing your request. Please try again later.",
			);
		}
	}

	async handleSMSMessage(message: string) {
		if (!this.context.callInfo) {
			logger.error("No call information available in the context");
			return;
		}

		const { to, from } = this.context.callInfo;
		const sessionId = `${to}-${from}`;

		try {
			const restaurantInfo = this.getRestaurantInfo();
			const response = await getOpenAIResponse(
				sessionId,
				`<sms phone="${from}">${message}</sms>`,
				restaurantInfo,
				this.tools,
			);
			await this.messageService.sendMessage(to, from, response);
		} catch (error) {
			logger.error(error, "Error processing SMS message:");
			await this.messageService.sendMessage(
				to,
				from,
				"I apologize, there was an error processing your request. Please try again later.",
			);
		}
	}

	private getRestaurantInfo(): string {
		const { business } = this.context;
		return JSON.stringify({
			"Restaurant Name": business.name,
			Address: business.address,
			"Phone Number": business.phone,
			Website: business.website,
			Hours: business.operatingHours,
			//Cuisine: business?.cuisineType || "N/A",
			//Delivery: business?.deliveryOptions || "N/A",
		});
	}
}
