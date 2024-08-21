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
	getResponse(transcript: string, sessionId: string): Promise<string>;
}

export interface AgentService {
	startListening(
		sessionId: string,
		onSpeaking: (audio: AsyncGenerator<Buffer>) => void,
	): void;
	sendAudio(audio: Buffer): void;
	stopListening(): void;
}
