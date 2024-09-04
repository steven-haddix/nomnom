import {
	createClient,
	LiveTranscriptionEvents,
	type ListenLiveClient,
} from "@deepgram/sdk";
import env from "@/utils/env";
import { logger } from "@/utils/logger";
import type { AudioProcessingService } from "@/types/interfaces";

export class DeepgramService implements AudioProcessingService {
	private client;
	private liveSessions: Map<string, ListenLiveClient>;

	constructor() {
		this.client = createClient(env.DEEPGRAM_API_KEY);
		this.liveSessions = new Map();
		logger.info("DeepgramService initialized");
	}

	async *synthesizeSpeech(text: string): AsyncGenerator<Buffer> {
		logger.info({ text }, "Synthesizing speech with Deepgram");
		const response = await this.client.speak.request(
			{ text },
			{
				model: "aura-asteria-en",
				encoding: "mp3",
				//sample_rate: 8000,
				channels: 1,
			},
		);
		const stream = await response.getStream();

		if (stream) {
			const reader = stream.getReader();
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				yield Buffer.from(value);
			}
		} else {
			logger.error("Error generating audio:", stream);
			throw new Error("Error generating audio: Stream is empty");
		}
	}

	async *synthesizeSpeechStream(
		textStream: AsyncIterable<string>,
	): AsyncGenerator<Buffer> {
		logger.info("Synthesizing speech with Deepgram");
		const textChunks: string[] = [];
		const audioChunks: Buffer[] = [];

		for await (const text of textStream) {
			textChunks.push(text);
			const response = await this.client.speak.request(
				{ text },
				{
					model: "aura-asteria-en",
					encoding: "mp3",
					channels: 1,
				},
			);
			const stream = await response.getStream();

			if (stream) {
				const reader = stream.getReader();
				const audioChunk: Buffer[] = [];
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					audioChunk.push(Buffer.from(value));
				}
				audioChunks.push(Buffer.concat(audioChunk));
			} else {
				logger.error("Error generating audio:", stream);
				throw new Error("Error generating audio: Stream is empty");
			}
		}

		for (let i = 0; i < textChunks.length; i++) {
			yield audioChunks[i];
		}
	}

	createSession(sessionId: string, onTranscript: (transcript: string) => void) {
		if (this.liveSessions.has(sessionId)) {
			throw new Error(`Session with ID ${sessionId} already exists`);
		}

		const live = this.client.listen.live({
			model: "nova-2",
			encoding: "mulaw",
			smart_format: true,
			filler_words: true,
			endpointing: 500,
			sample_rate: 8000,
			channels: 1,
		});

		live.on(LiveTranscriptionEvents.Open, () => {
			logger.info(
				`Deepgram live streaming connection opened for session ${sessionId}`,
			);

			live.on(LiveTranscriptionEvents.Metadata, (data) => {
				logger.info("Deepgram Metadata:", data);
			});

			live.on(LiveTranscriptionEvents.Transcript, (data) => {
				const transcript = data.channel.alternatives[0].transcript;
				if (!transcript) {
					//logger.info("Empty transcript received");
					return;
				}

				logger.info({ transcript }, "Deepgram Transcript:");

				logger.info(
					{ transcript: data.channel.alternatives[0].transcript },
					`Deepgram live streaming transcript for session ${sessionId}:`,
				);
				onTranscript(transcript);
			});

			live.on(LiveTranscriptionEvents.Close, () => {
				logger.info(
					`Deepgram live streaming connection closed for session ${sessionId}`,
				);
				this.liveSessions.delete(sessionId);
			});

			live.on(LiveTranscriptionEvents.SpeechStarted, (data) => {
				logger.info("Deepgram SpeechStarted");
			});

			live.addListener(LiveTranscriptionEvents.Error, (err) => {
				logger.error(err);
			});
		});

		this.liveSessions.set(sessionId, live);
		logger.info(
			`Deepgram new live streaming total sessions: ${this.liveSessions.size}`,
		);
	}

	sendAudio(sessionId: string, audio: Buffer) {
		const live = this.liveSessions.get(sessionId);
		if (!live) {
			throw new Error(`Session with ID ${sessionId} not found`);
		}

		if ((audio instanceof Blob && audio?.size === 0) || audio?.length === 0) {
			logger.warn("Empty audio blob received");
			return;
		}
		//console.log(live.getReadyState());
		// @ts-expect-error - Buffer is not recognized as a valid type for audio but its the only type that works
		live.send(audio);
	}

	deleteSession(sessionId: string) {
		const live = this.liveSessions.get(sessionId);
		if (!live) {
			throw new Error(`Session with ID ${sessionId} not found`);
		}
		logger.info(
			`Closing Deepgram live streaming connection for session ${sessionId}`,
		);
		live?.requestClose();
		this.liveSessions.delete(sessionId);
	}
}
