import { t } from "elysia";

export const VoiceWebhook = t.Object({
	data: t.Object({
		record_type: t.Optional(t.String()),
		event_type: t.Optional(t.String()),
		id: t.Optional(t.String()),
		occurred_at: t.Optional(t.String()),
		payload: t.Object({
			call_control_id: t.Optional(t.String()),
			connection_id: t.Optional(t.String()),
			call_leg_id: t.Optional(t.String()),
			call_session_id: t.Optional(t.String()),
			client_state: t.Optional(t.String()),
			from: t.Optional(t.String()),
			to: t.Optional(t.String()),
			direction: t.Optional(t.String()),
			state: t.Optional(t.String()),
		}),
	}),
	meta: t.Object({
		attempt: t.Number(),
		delivered_to: t.String(),
	}),
});

const example = {
	data: {
		event_type: "call.initiated",
		id: "1651ab39-6a3f-46e3-8ad8-3aaa71370456",
		occurred_at: "2024-08-22T23:01:36.779278Z",
		payload: {
			call_control_id:
				"v3:DgTejq-Gh6HwA6i3GH9treBvU7bQ1PZnOQdwW8S-VSTd_jXN5j-EWw",
			call_leg_id: "7bceb15a-60da-11ef-a229-02420a1f0a69",
			call_session_id: "7bcebcf4-60da-11ef-8e8d-02420a1f0a69",
			caller_id_name: "+15137226459",
			client_state: null,
			connection_codecs: "PCMA,PCMU,VP8,H264",
			connection_id: "2501214467375760624",
			direction: "incoming",
			from: "+15137226459",
			offered_codecs: "PCMU,PCMA",
			start_time: "2024-08-22T23:01:36.779278Z",
			state: "parked",
			to: "+16142651546",
		},
		record_type: "event",
	},
	meta: {
		attempt: 1,
		delivered_to: "https://9c28-65-24-62-194.ngrok-free.app/telnyx/voice",
	},
};
