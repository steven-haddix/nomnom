// mock-call.service.ts
import { EventEmitter } from "node:events";
import type { RestaurantSelect } from "@/db/schema";
import { logger } from "@/utils/logger";

export class MockCallService {
	private eventEmitter: EventEmitter = new EventEmitter();
	private onSpeakingCallback: (text: AsyncGenerator<string>) => void = () => {};

	async initCall(callId: string, to: string, from: string, platform: string) {
		// No-op
	}

	async fetchCall(callId: string) {
		// Return a mock call object
		return {
			callId,
			to: "",
			from: "",
			platform: "",
		};
	}

	startCall(
		callId: string,
		onSpeaking: (audio: AsyncGenerator<string>) => void,
	) {
		this.onSpeakingCallback = onSpeaking;
		this.eventEmitter.emit("callStarted", callId);
	}

	endCall(callId: string) {
		this.eventEmitter.emit("callEnded", callId);
	}

	onCallEnded(listener: (callId: string) => void) {
		this.eventEmitter.on("callEnded", listener);
	}

	removeCallEndedListener(listener: (callId: string) => void) {
		this.eventEmitter.off("callEnded", listener);
	}

	onCallStarted(listener: (callId: string) => void) {
		this.eventEmitter.on("callStarted", listener);
	}

	removeCallStartedListener(listener: (callId: string) => void) {
		this.eventEmitter.off("callStarted", listener);
	}

	async speakToCallStream(callId: string, textStream: AsyncIterable<string>) {
		this.onSpeakingCallback(textStream);
	}

	async speakToCall(callId: string, text: string) {
		// need to return a AsyncIterable<string> to match the type
		this.onSpeakingCallback(
			(async function* () {
				yield text;
			})(),
		);
	}

	// Other methods can be left empty or with minimal implementation
}
