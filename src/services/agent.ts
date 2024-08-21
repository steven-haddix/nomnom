// agentService.ts
import type {
	AudioProcessingService,
	LanguageModelService,
	AgentService,
} from "../types/interfaces";
import { logger } from "@/utils/logger";

export class BasicSessionAgent implements AgentService {
	private sessionId: string | null = null;
	private onSpeakingCallback: ((audio: AsyncGenerator<Buffer>) => void) | null =
		null;

	constructor(
		private audioProcessingService: AudioProcessingService,
		private languageModelService: LanguageModelService,
	) {
		logger.info("BasicSessionAgent initialized");
	}

	startListening(
		sessionId: string,
		onSpeaking: (audio: AsyncGenerator<Buffer>) => void,
	) {
		this.onSpeakingCallback = onSpeaking;
		this.sessionId = sessionId;

		this.audioProcessingService.createSession(
			this.sessionId,
			async (transcript: string) => {
				logger.info({ transcript }, "Transcript received");
				const response = await this.languageModelService.getResponse(
					transcript,
					sessionId,
				);
				const audio = this.audioProcessingService.synthesizeSpeech(response);
				this.onSpeakingCallback?.(audio);
			},
		);
	}

	sendAudio(audio: Buffer) {
		if (!this.sessionId) {
			throw new Error("No active listening session");
		}
		this.audioProcessingService.sendAudio(this.sessionId, audio);
	}

	stopListening() {
		if (!this.sessionId) {
			throw new Error("No active listening session");
		}
		this.audioProcessingService.deleteSession(this.sessionId);
		this.sessionId = null;
		this.onSpeakingCallback = null;
	}
}
