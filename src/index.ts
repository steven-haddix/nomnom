import { Elysia, t } from "elysia";
import twilio from "twilio";
import env from "@/utils/env";
import { logger, logPlugin } from "@/utils/logger";
import "@/utils/polyfill";
import { DeepgramService } from "@/services/deepgram";
import { ElevenLabsService } from "@/services/eleven-labs.service";
import RestaurantService from "@/services/restaurant";
import { CallService } from "@/services/call.service";
import { MessageService } from "@/services/message.service";
import { AgentFactory } from "@/agents/agent.factory";
import { AgentContextFactory } from "@/agents/agent-context.factory";
import { TelnyxSMSWebhookPayload } from "@/models/telnyx.model";
import type { WebSocketPayload, WebhookPayload } from "@/types/telnyx";
import { l1Distance } from "drizzle-orm";

const accountSid = env.TWILIO_ACCOUNT_SID;
const authToken = env.TWILIO_AUTH_TOKEN;
const appSid = env.TWILIO_APP_SID;
const apiKey = env.TWILIO_API_SID;
const apiSecret = env.TWILIO_API_SECRET;

if (!accountSid || !appSid || !authToken || !apiKey || !apiSecret) {
	throw new Error("Missing Twilio credentials");
}

const client = twilio(accountSid, authToken);
const telnyxClient = require("telnyx")(env.TELNYX_API_KEY);

const restaurantService = new RestaurantService();
const agentContextFactory = new AgentContextFactory(restaurantService);
const callService = new CallService(
	new DeepgramService(),
	new ElevenLabsService(),
);
const messageService = new MessageService();
const agentFactory = new AgentFactory(callService, messageService);

const app = new Elysia()
	.use(logPlugin)
	.decorate(() => ({}))
	.post(
		"/telnyx/sms",
		async ({ body: { data }, log }) => {
			try {
				if (data.event_type === "message.received") {
					const agentContext = await agentContextFactory.createContext(
						undefined,
						data.payload.to[0].phone_number,
						data.payload.from.phone_number,
					);
					const agent = agentFactory.createAgent(agentContext);

					await agent.handleSMSMessage(data.payload.text);

					log.info("SMS Message handled");
					return {};
				}

				if (data.event_type === "message.finalized") {
					switch (data.payload.to[0].status) {
						case "delivered":
							log.info("Message delivered");
							break;
						case "sending_failed":
						case "delivery_failed":
							log.error(data, "Message delivery failed");
							break;
						default:
							log.warn(data, "Unhandled message status");
					}
				}
			} catch (error) {
				log.error(error, "Error handling Telnyx SMS webhook");
			}
		},
		{
			body: TelnyxSMSWebhookPayload,
		},
	)
	.post("/telnyx/voice", async ({ body, log }) => {
		try {
			const { data } = body as WebhookPayload;

			const call = new telnyxClient.Call({
				call_control_id: data.payload.call_control_id,
			});

			if (data.event_type === "call.initiated") {
				try {
					log.info(data, "Received call initiated event");
					call.answer();
					return;
				} catch (error) {
					log.error(error, "Error initiating call");
					return {};
				}
			}

			if (data.event_type === "call.answered") {
				log.info(data, "Received call.answered event");

				await callService.initCall(
					data.payload.call_control_id,
					data.payload.to,
					data.payload.from,
					"telnyx",
				);

				const { data: stream } = await call.streamingStart({
					client_state: "aGF2ZSBhIG5pY2UgZGF5ID1d",
					command_id: "891510ac-f3e4-11e8-af5b-de00688a4901",
					stream_track: "both_tracks",
					stream_url: `${env.NOMNOM_WS_URL}/telnyx/ws/${data.payload.call_control_id}`,
				});

				log.info(stream, "Stream initiated");
				return {};
			}

			const { event_type } = data;
			log.info({ event_type }, "Received Unhandled Telnyx voice webhook");
			return {};
		} catch (error) {
			log.error(error, "Error handling Telnyx voice webhook");
		}
	})
	.group("/telnyx/ws/:id", (api) => {
		return api
			.derive(async ({ log, params: { id } }) => {
				const callRecord = await callService.fetchCall(id);

				// log.info(callRecord, "Fetched call from repository");
				const agentContext = await agentContextFactory.createContext(
					id,
					callRecord.to,
					callRecord.from,
				);
				const agent = agentFactory.createAgent(agentContext);

				const call = new telnyxClient.Call({
					call_control_id: callRecord.callId,
				});
				
				return {
					call,
					callId: callRecord.callId,
				};
			})
			.get("/", ({ request, log, server }) => {
				if (server?.upgrade(request)) return;
				log.error("Upgrade failed");
				return new Response("Upgrade failed", { status: 500 });
			})
			.ws("/", {
				message: async (
					{ send, close, data: { call, log, callId, params } },
					message,
				) => {
					try {
						const payload = message as WebSocketPayload;
						if(payload.event !== 'media') {
							log.info(message, "Received WebSocket message");
						}
						if (payload.event === "connected") {
							log.info("Received connected event");
						}

						if (payload.event === "start") {
							log.info(message, "Received start event");
							callService.startCall(
								callId,
								async (audio: AsyncGenerator<Buffer>) => {
									let accumulatedChunks: Buffer[] = [];
									let lastSendTime = Date.now();

									for await (const chunk of audio) {
										accumulatedChunks.push(chunk);

										const currentTime = Date.now();
										if (currentTime - lastSendTime >= 1000) {
											const combinedChunk = Buffer.concat(accumulatedChunks);
											console.log("Sending accumulated audio to Telnyx");

											send(
												JSON.stringify({
													event: "media",
													stream_id: callId,
													media: {
														payload: combinedChunk.toString("base64"),
													},
												}),
											);

											accumulatedChunks = [];
											lastSendTime = currentTime;
										}
									}

									// Send any remaining accumulated chunks
									if (accumulatedChunks.length > 0) {
										const combinedChunk = Buffer.concat(accumulatedChunks);
										console.log(
											"Sending remaining accumulated audio to Telnyx",
										);

										send(
											JSON.stringify({
												event: "media",
												stream_id: callId,
												media: {
													payload: combinedChunk.toString("base64"),
												},
											}),
										);
									}
								},
							);

							callService.onCallTransfer( async (eventCallId, to) => {
								if (eventCallId === callId) {
									log.info({ to }, "Transferring call");
									callService.speakToCall(callId, "Please wait while I transfer your call");
									// TODO: get this to await longer than 1 second
									await call.transfer({
										to,
									});
								}
							})
						}

						if (
							payload.event === "media" &&
							payload.media?.track === "inbound"
						) {
							//log.info("Received media event");
							try {
								callService.handleCallAudio(
									callId,
									Buffer.from(payload.media.payload, "base64"),
								);
							} catch (error) {
								log.error(error, "Error sending audio to agent");
								close();
							}
						}

						if (payload.event === "stop") {
							log.info("Received stop event");
						}

						if (payload.event === "error") {
							log.error(message, "Received error event");
							close();
						}
					} catch (error) {
						log.error(error, "Error handling WebSocket message");
					}
				},
				open: ({ data: { log, query } }) => {
					log.info("WebSocket connection established");
				},
				close: ({ data: { log, callId } }) => {
					log.info("WebSocket connection closed");
					callService.endCall(callId);
				},
				error: ({ error }) => {
					logger.error(error);
				},
			});
	})
	.get(
		"/twilio/voice",
		async ({ query, log }) => {
			log.info(query, "Received Twilio voice webhook");
			if (!query.To) {
				return new Response("Missing 'To' query parameter", { status: 400 });
			}

			await callService.initCall(query.CallSid, query.To, query.From, "twilio");

			const stream = await client.calls(query.CallSid).streams.create({
				url: `${env.NOMNOM_WS_URL}/twilio/ws/${query.CallSid}`,
			});

			stream.sid;
			return {};
		},
		{
			query: t.Object({
				ApplicationSid: t.Optional(t.String()),
				ApiVersion: t.String(),
				Called: t.Optional(t.String()),
				Caller: t.String(),
				CallStatus: t.String(),
				From: t.String(),
				CallSid: t.String(),
				To: t.Optional(t.String()),
				Direction: t.String(),
				AccountSid: t.String(),
			}),
		},
	)
	.group("/twilio/ws/:id", (api) => {
		return api
			.get("/", ({ request, server }) => {
				if (server?.upgrade(request)) return;
				return new Response("Upgrade failed", { status: 500 });
			})
			.derive(async ({ log, params: { id } }) => {
				const call = await callService.fetchCall(id);

				log.info(call, "Fetched call from repository");
				const agentContext = await agentContextFactory.createContext(
					id,
					call.to,
					call.from,
				);
				const agent = agentFactory.createAgent(agentContext);

				return {
					callId: call.callId,
				};
			})
			.ws("/", {
				message: async ({ send, data: { callId, log } }, message) => {
					const payload = message as TwilioWebSocketMessage;

					if (payload.event === "connected") {
						log.info("Received connected event");
					}

					if (payload.event === "start") {
						log.info(message, "Received start event");
						callService.startCall(
							payload.streamSid,
							async (audio: AsyncGenerator<Buffer>) => {
								for await (const chunk of audio) {
									send(
										JSON.stringify({
											event: "media",
											streamSid: payload.streamSid,
											media: {
												payload: chunk.toString("base64"),
											},
										}),
									);
								}
								send(
									JSON.stringify({
										event: "mark",
										streamSid: payload.streamSid,
										mark: {
											name: "Processed media with AI response",
										},
									}),
								);
							},
						);
					}

					if (payload.event === "media") {
						callService.handleCallAudio(
							callId,
							Buffer.from(payload.media.payload, "base64"),
						);
					}

					if (payload.event === "stop") {
						callService.endCall(callId);
					}
				},
				open: ({ data: { log, query } }) => {
					log.info("WebSocket connection established");
				},
				close: ({ data: { log, callId } }) => {
					log.info("WebSocket connection closed");
					callService.endCall(callId);
				},
				error: ({ error }) => {
					logger.error(error);
				},
			});
	})
	.listen(3000);

logger.info(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
