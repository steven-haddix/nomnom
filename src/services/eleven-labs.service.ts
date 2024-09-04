import { ElevenLabsClient } from "elevenlabs";
import type { SpeechService } from "@/types/interfaces";
import env from "@/utils/env";

export class ElevenLabsService implements SpeechService {
	private client: ElevenLabsClient;

	constructor() {
		this.client = new ElevenLabsClient({ apiKey: env.ELEVEN_LABS_API_KEY });
	}

	async *synthesizeSpeech(text: string): AsyncGenerator<Buffer> {
		const audioStream = await this.client.generate({
			voice: "Rachel",
			text,
			model_id: "eleven_monolingual_v1",
		});

		for await (const chunk of audioStream) {
			yield Buffer.from(chunk);
		}
	}

	async *synthesizeSpeechStream(
		textStream: AsyncIterable<string>,
	): AsyncGenerator<Buffer> {
		for await (const text of textStream) {
			const audioStream = await this.client.generate({
				stream: true,
				voice: "Rachel",
				text,
				model_id: "eleven_monolingual_v1",
			});
			for await (const chunk of audioStream) {
				yield Buffer.from(chunk);
			}
		}
	}
}
