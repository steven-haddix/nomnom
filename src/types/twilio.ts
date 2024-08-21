type TwilioWebSocketMessage =
	| ConnectedMessage
	| StartMessage
	| MediaMessage
	| DTMFMessage
	| StopMessage
	| MarkMessage
	| ClearMessage;

interface ConnectedMessage {
	event: "connected";
	protocol: string;
	version: string;
}

interface StartMessage {
	event: "start";
	sequenceNumber: string;
	start: {
		accountSid: string;
		streamSid: string;
		callSid: string;
		tracks: string[];
		mediaFormat: {
			encoding: "audio/x-mulaw";
			sampleRate: 8000;
			channels: 1;
		};
		customParameters: Record<string, string>;
	};
	streamSid: string;
}

interface MediaMessage {
	event: "media";
	sequenceNumber: string;
	media: {
		track: "inbound" | "outbound";
		chunk: string;
		timestamp: string;
		payload: string;
	};
	streamSid: string;
}

interface DTMFMessage {
	event: "dtmf";
	streamSid: string;
	sequenceNumber: string;
	dtmf: {
		track: "inbound_track";
		digit: string;
	};
}

interface StopMessage {
	event: "stop";
	sequenceNumber: string;
	stop: {
		accountSid: string;
		callSid: string;
	};
	streamSid: string;
}

interface MarkMessage {
	event: "mark";
	sequenceNumber: string;
	streamSid: string;
	mark: {
		name: string;
	};
}

interface ClearMessage {
	event: "clear";
	streamSid: string;
}
