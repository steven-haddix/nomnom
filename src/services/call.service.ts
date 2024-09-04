// callService.ts
import { EventEmitter } from "node:events";
import type {
	AudioProcessingService,
	LanguageModelService,
	AgentService,
	SpeechService,
} from "@/types/interfaces";
import type RestaurantService from "@/services/restaurant";
import type { RestaurantSelect } from "@/db/schema";
import { callRepository } from "@/kv/schema";
import { logger } from "@/utils/logger";

type CallId = string;

interface CallSession {
	callId: string;
	onSpeaking: (audio: AsyncGenerator<Buffer>) => void;
	transcriptListeners: ((transcript: string) => void)[];
	audioListeners: ((audio: Buffer) => void)[];
}

export class CallService {
	private callSessions: Map<CallId, CallSession> = new Map();
	private eventEmitter: EventEmitter = new EventEmitter();

	constructor(
		private audioProcessingService: AudioProcessingService,
		private speechService: SpeechService,
	) {
		logger.info("CallService initialized");
	}

	async initCall(callId: string, to: string, from: string, platform: string) {
		await callRepository.save(callId, {
			callId,
			to,
			from,
			platform,
		});
		await callRepository.expire(callId, 3600);

		// Create the call session during initCall
		const callSession: CallSession = {
			callId,
			onSpeaking: () => {},
			transcriptListeners: [],
			audioListeners: [],
		};
		this.callSessions.set(callId, callSession);
	}

	async fetchCall(callId: string) {
		const call = await callRepository.fetch(callId);
		if (!call) {
			throw new Error("Call not found");
		}
		return call;
	}

	startCall(
		callId: string,
		onSpeaking: (audio: AsyncGenerator<Buffer>) => void,
	) {
		const callSession = this.callSessions.get(callId);
		if (!callSession) {
			throw new Error(`Call session not found for callId: ${callId}`);
		}

		// Update onSpeaking callback for session
		callSession.onSpeaking = onSpeaking;

		this.audioProcessingService.createSession(
			callId,
			async (transcript: string) => {
				this.sendTranscriptToListeners(callId, transcript);
			},
		);

		// Emit the 'callStarted' event
		this.eventEmitter.emit("callStarted", callId);
	}

	stopCall(callId: string) {
		const callSession = this.callSessions.get(callId);
		if (!callSession) {
			throw new Error(`Call session not found for callId: ${callId}`);
		}

		this.audioProcessingService.deleteSession(callId);
		this.callSessions.delete(callId);
	}

	endCall(callId: string) {
		const callSession = this.callSessions.get(callId);
		if (!callSession) {
			throw new Error(`Call session not found for callId: ${callId}`);
		}

		this.audioProcessingService.deleteSession(callId);
		this.callSessions.delete(callId);

		// Emit the 'callEnded' event
		this.eventEmitter.emit("callEnded", callId);
		logger.info(`Call ended for callId: ${callId}`);
	}

	onCallEnded(listener: (callId: string) => void) {
		this.eventEmitter.on("callEnded", listener);
	}

	removeCallEndedListener(listener: (callId: string) => void) {
		this.eventEmitter.off("callEnded", listener);
	}

	handleCallAudio(callId: string, audio: Buffer) {
		const callSession = this.callSessions.get(callId);
		if (!callSession) {
			throw new Error(`Call session not found for callId: ${callId}`);
		}

		this.audioProcessingService.sendAudio(callId, audio);
		this.sendAudioToListeners(callId, audio);
	}

	subscribeToTranscripts(
		callId: string,
		listener: (transcript: string) => void,
	) {
		const callSession = this.callSessions.get(callId);
		if (!callSession) {
			throw new Error(`Call session not found for callId: ${callId}`);
		}

		callSession.transcriptListeners.push(listener);
	}

	unsubscribeFromTranscripts(
		callId: string,
		listener: (transcript: string) => void,
	) {
		const callSession = this.callSessions.get(callId);
		if (!callSession) {
			throw new Error(`Call session not found for callId: ${callId}`);
		}

		const index = callSession.transcriptListeners.indexOf(listener);
		if (index !== -1) {
			callSession.transcriptListeners.splice(index, 1);
		}
	}

	subscribeToAudio(callId: string, listener: (audio: Buffer) => void) {
		const callSession = this.callSessions.get(callId);
		if (!callSession) {
			throw new Error(`Call session not found for callId: ${callId}`);
		}

		callSession.audioListeners.push(listener);
	}

	unsubscribeFromAudio(callId: string, listener: (audio: Buffer) => void) {
		const callSession = this.callSessions.get(callId);
		if (!callSession) {
			throw new Error(`Call session not found for callId: ${callId}`);
		}

		const index = callSession.audioListeners.indexOf(listener);
		if (index !== -1) {
			callSession.audioListeners.splice(index, 1);
		}
	}

	speakToCall(callId: string, text: string) {
		const callSession = this.callSessions.get(callId);
		if (!callSession) {
			throw new Error(`Call session not found for callId: ${callId}`);
		}

		const audio = this.speechService.synthesizeSpeech(text);
		callSession.onSpeaking(audio);
	}

	async speakToCallStream(callId: string, textStream: AsyncIterable<string>) {
		const callSession = this.callSessions.get(callId);
		if (!callSession) {
			throw new Error(`Call session not found for callId: ${callId}`);
		}

		const audioStream = this.speechService.synthesizeSpeechStream(textStream);
		callSession.onSpeaking(audioStream);
	}

	onCallStarted(listener: (callId: string) => void) {
		this.eventEmitter.on("callStarted", listener);
	}

	removeCallStartedListener(listener: (callId: string) => void) {
		this.eventEmitter.off("callStarted", listener);
	}

	private sendTranscriptToListeners(callId: string, transcript: string) {
		const callSession = this.callSessions.get(callId);
		if (!callSession) {
			throw new Error(`Call session not found for callId: ${callId}`);
		}

		for (const listener of callSession.transcriptListeners) {
			listener(transcript);
		}
	}

	private sendAudioToListeners(callId: string, audio: Buffer) {
		const callSession = this.callSessions.get(callId);
		if (!callSession) {
			throw new Error(`Call session not found for callId: ${callId}`);
		}

		for (const listener of callSession.audioListeners) {
			listener(audio);
		}
	}
}
