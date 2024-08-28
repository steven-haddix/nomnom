import { t } from "elysia";

export const TelnyxSMSWebhookPayload = t.Object({
	data: t.Object({
		event_type: t.String(),
		id: t.String(),
		occurred_at: t.String(),
		payload: t.Object({
			completed_at: t.Union([t.String(), t.Null()]),
			cost: t.Union([
				t.Object({
					amount: t.String(),
					currency: t.String(),
				}),
				t.Null(),
			]),
			direction: t.String(),
			encoding: t.String(),
			errors: t.Array(t.Any()),
			from: t.Object({
				carrier: t.String(),
				line_type: t.String(),
				phone_number: t.String(),
				status: t.Optional(t.String()),
			}),
			id: t.String(),
			media: t.Array(t.Any()),
			messaging_profile_id: t.String(),
			organization_id: t.String(),
			parts: t.Number(),
			received_at: t.String(),
			record_type: t.String(),
			sent_at: t.Union([t.String(), t.Null()]),
			tags: t.Array(t.Any()),
			text: t.String(),
			to: t.Array(
				t.Object({
					carrier: t.String(),
					line_type: t.String(),
					phone_number: t.String(),
					status: t.String(),
				}),
			),
			type: t.String(),
			valid_until: t.Union([t.String(), t.Null()]),
			webhook_failover_url: t.Union([t.String(), t.Null()]),
			webhook_url: t.String(),
		}),
		record_type: t.String(),
	}),
	meta: t.Object({
		attempt: t.Number(),
		delivered_to: t.String(),
	}),
});
