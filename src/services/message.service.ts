// messageService.ts
import { logger } from "@/utils/logger";
import env from "@/utils/env";

const telnyxClient = require("telnyx")(env.TELNYX_API_KEY);

export class MessageService {
	async sendMessage(from: string, to: string, text: string) {
		try {
			const message = await telnyxClient.messages.create({
				from,
				to,
				text,
			});
			logger.info(message, "Sent SMS message");
		} catch (error) {
			logger.error(error, "Error sending SMS message");
			throw error;
		}
	}
}
