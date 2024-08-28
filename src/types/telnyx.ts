// Base Event Type
type BaseEvent = {
	event: string;
	sequence_number: string;
	stream_id: string;
};

// Media Format Type
type MediaFormat = {
	encoding: string;
	sample_rate: number;
	channels: number;
};

// Common Payload Type
type CommonPayload = {
	call_control_id: string;
	stream_url?: string;
};

// Type when the WebSocket connection is established
type ConnectedEvent = {
	event: "connected";
	version: string;
};

// Type for start event over WebSocket
export type StartEvent = BaseEvent & {
	event: "start";
	start: {
		user_id: string;
		call_control_id: string;
		media_format: MediaFormat;
	};
};

// Type for media event over WebSocket
type MediaEvent = BaseEvent & {
	event: "media";
	media: {
		track: "inbound" | "outbound";
		chunk: string;
		timestamp: string;
		payload: string; // Base64-encoded RTP payload
	};
};

// Type for stop event over WebSocket
type StopEvent = BaseEvent & {
	event: "stop";
	stop: {
		user_id: string;
		call_control_id: string;
	};
};

type ErrorEvent = BaseEvent & {
	event: "error";
	payload: {
		code: number;
		title: string;
		detail: string;
	};
	stream_id: string;
};

export type CallAnsweredWebhook = {
	data: {
		record_type: "event";
		event_type: "call.answered";
		id: string;
		occurred_at: string;
		payload: {
			call_control_id: string;
			connection_id: string;
			call_leg_id: string;
			call_session_id: string;
			client_state: string;
			from: string;
			to: string;
			direction: string;
			state: string;
		};
	};
};

export type CallInitiatedWebhook = {
	data: {
		record_type: "event";
		event_type: "call.initiated";
		id: string;
		occurred_at: string;
		payload: {
			call_control_id: string;
			connection_id: string;
			call_leg_id: string;
			call_session_id: string;
			client_state: string;
			from: string;
			to: string;
			direction: string;
			state: string;
		};
	};
};

// Type for streaming.started webhook
export type StreamingStartedWebhook = {
	data: {
		event_type: "streaming.started";
		id: string;
		occurred_at: string;
		payload: CommonPayload;
		record_type: "event";
	};
};

// Type for streaming.stopped webhook
export type StreamingStoppedWebhook = {
	data: {
		event_type: "streaming.stopped";
		id: string;
		occurred_at: string;
		payload: CommonPayload;
		record_type: "event";
	};
};

export type WebhookPayload =
	| CallInitiatedWebhook
	| CallAnsweredWebhook
	| StreamingStartedWebhook
	| StreamingStoppedWebhook;

// Union Type for All WebSocket Payloads
export type WebSocketPayload =
	| ConnectedEvent
	| StartEvent
	| MediaEvent
	| StopEvent
	| ErrorEvent;
