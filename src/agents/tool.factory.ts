import { z } from "zod";
import { tool } from "@langchain/core/tools";
import type { MessageService } from "@/services/message.service";
import { logger } from "@/utils/logger";
import type { StructuredTool } from "@langchain/core/tools";
import { CallService } from "@/services/call.service";
import { AgentContext } from "@/types/interfaces";

export type ToolsObject = {
	tools: StructuredTool[];
	toolsByName: Record<string, StructuredTool>;
};

export class ToolFactory {
	constructor(
		private messageService: MessageService, 
		private callService: CallService, 
		private agentContext: AgentContext
	) {}

	createRestaurantTools(): ToolsObject {
		const sendSMSTool = this.createSendSMSTool();
		const transferCallTool = this.createTransferCallTool();

		const toolsByName: Record<string, StructuredTool> = {
			sendSMS: sendSMSTool,
			transferCall: transferCallTool
			// Add more restaurant-specific tools here
		};

		return {
			tools: Object.values(toolsByName),
			toolsByName,
		};
	}

	static emptyTools: ToolsObject = {
		tools: [],
		toolsByName: {},
	};

	private createSendSMSTool() {
		return tool(
			async ({ from, to, message }) => {
				try {
					await this.messageService.sendMessage(from, to, message);
					logger.info(`Sent SMS from ${from} to ${to}: ${message}`);
					return `SMS sent successfully to ${to}`;
				} catch (error) {
					logger.error(
						`Error sending SMS from ${from} to ${to}: ${message}`,
						error,
					);
					return `Failed to send SMS to ${to}`;
				}
			},
			{
				name: "sendSMS",
				description: "Send an SMS message to a phone number",
				schema: z.object({
					from: z
						.string()
						.describe("The restaurant phone number the message is from"),
					to: z.string().describe("The phone number of the customer"),
					message: z.string().describe("The message to send"),
				}),
			},
		);
	}

	private createTransferCallTool() {
		return tool(
			async({to}) =>{
				try {
					// add transfer number instead of agentContext.business.phone
					this.callService.transferCall(this.agentContext.callInfo?.callId || '', this.agentContext.business.phone || '')
					logger.info(`Transfer call to ${to}`);	
				} catch (error) {
					
				}
			},
			{
				name: "transferCall",
				description: "Transfer current call to a different phone number",
				schema: z.object({
					to: z.string().describe("The phone number of the restaurant humans"),
				}),
			}
		)
	}
}
