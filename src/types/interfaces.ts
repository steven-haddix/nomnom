export interface CommunicationService {
	sendSMS(from: string, to: string, body: string): Promise<void>;
	receiveSMS(callback: (from: string, body: string) => void): void;

	sendAudio(sessionId: string, audio: Buffer): void;
	makeVoiceCall(from: string, to: string, url: string): Promise<void>;
	receiveVoiceCall(callback: (from: string, callSid: string) => void): void;
}
export interface AudioProcessingService {
	createSession(
		sessionId: string,
		onTranscript: (transcript: string) => void,
	): void;
	sendAudio(sessionId: string, audio: Buffer): void;
	deleteSession(sessionId: string): void;
	synthesizeSpeech(text: string): AsyncGenerator<Buffer>;
}

export interface LanguageModelService {
	getResponse(
		sessionId: string,
		transcript: string,
		restaurant_info: string,
	): Promise<string>;
}

export interface AgentService {
	startCall(
		sessionId: string,
		onSpeaking: (audio: AsyncGenerator<Buffer>) => void,
	): void;
	handleCallAudio(audio: Buffer): void;
	stopListening(): void;
}

export interface Business {
	id: string;
	name: string;
	type: string;
	address?: string | null;
	phone?: string | null;
	website?: string | null;
	operatingHours?: string | null;
	// Add other common business properties as needed
}

export interface AgentContext {
	callInfo?: {
		callId: string;
		to: string;
		from: string;
	};
	customer: {
		id: string;
		name: string;
		// Add other customer properties as needed
	};
	business: Business;
}
