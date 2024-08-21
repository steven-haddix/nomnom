import { Elysia, t } from "elysia";
import twilio from "twilio";
import { Log, logger } from "@/utils/logger";
import { BasicSessionAgent } from "@/services/agent";
import { DeepgramService } from "@/services/deepgram";
import { getOpenAIResponse } from "@/services/langchain";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const appSid = process.env.TWILIO_APP_SID;
const apiKey = process.env.TWILIO_API_SID;
const apiSecret = process.env.TWILIO_API_SECRET;

if (!accountSid || !appSid || !authToken || !apiKey || !apiSecret) {
	throw new Error("Missing Twilio credentials");
}

const client = twilio(accountSid, authToken);
const deepgram = new DeepgramService();

const app = new Elysia()
	.use(
		logger.into({
			autoLogging: {
				ignore: (ctx) => {
					let duration = 0;

					if (
						(ctx.store as { requestStart?: bigint }).requestStart !==
							undefined &&
						typeof (ctx.store as { requestStart?: bigint }).requestStart ===
							"bigint"
					) {
						duration = Number(
							process.hrtime.bigint() -
								(ctx.store as { requestStart: bigint }).requestStart,
						);
					}

					// Construct log object
					const logObject: Log = new Log({
						request: {
							ip: ctx.ip,
							method: ctx.request.method,
							url: {
								path: ctx.path,
								params: Object.fromEntries(
									new URLSearchParams(new URL(ctx.request.url).search),
								),
							},
						},
						response: {
							status_code: ctx.set.status,
							time: performance.now() - ctx.store.startTime,
						},
					});

					if (ctx.request.headers.has("x-request-id")) {
						logObject.log.request.requestID =
							ctx.request.headers.get("x-request-id")!;
					}

					// Include headers
					for (const header of ["x-forwarded-for", "authorization"]) {
						if (ctx.request.headers.has(header)) {
							logObject.log.request.headers = {
								...logObject.log.request.headers,
								[header]: ctx.request.headers.get(header)!,
							};
						}
					}

					if (ctx.isError) {
						if (
							(ctx.store as { error?: string | Error | object }).error !==
							undefined
						) {
							logObject.error = (
								ctx.store as { error: string | Error | object }
							).error;
						}

						const message = logObject.formatJson();

						logger.error(message);
						return true;
					}

					const message = logObject.formatJson();

					logger.info(message);
					return true;
				},
			},
		}),
	)
	.get(
		"/twilio",
		async ({ query }) => {
			const res = new twilio.twiml.VoiceResponse();
			const connect = res.connect();
			const stream = connect.stream({
				url: "wss://9c28-65-24-62-194.ngrok-free.app/ws",
			});

			res.say(
				"Hello, this is Elysia. Please wait while we connect you to an agent.",
			);
			const response = new Response(res.toString());
			response.headers.set("Content-Type", "application/xml");

			return response;
			//const stream = await client.calls(query.CallSid).streams.create({
			//	name: "My Media Stream",
			//	url: "wss://9c28-65-24-62-194.ngrok-free.app/ws",
			//});
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
	.get("/ws", ({ request, server }) => {
		if (server?.upgrade(request)) return;
		return new Response("Upgrade failed", { status: 500 });
	})
	.group("/ws", (api) => {
		return (
			api
				//.decorate(() => ({
				//	deepgram: ,
				//}))
				.derive(() => {
					return {
						agent: new BasicSessionAgent(deepgram, {
							getResponse: getOpenAIResponse,
						}),
					};
				})
				.ws("/", {
					message: async ({ send, data: { agent, log } }, message) => {
						const payload = message as TwilioWebSocketMessage;

						if (payload.event === "connected") {
							log.info("Received connected event");
						}

						if (payload.event === "start") {
							agent.startListening(
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
							agent.sendAudio(Buffer.from(payload.media.payload, "base64"));
						}

						if (payload.event === "stop") {
							agent.stopListening();
						}
					},
					open: ({ data: { log } }) => {
						log.info("WebSocket connection established");
					},
					close: ({ data: { log } }) => {
						log.info("WebSocket connection closed");
					},
					error: ({ error }) => {
						logger.error(error);
					},
				})
		);
	})
	.listen(3000);

logger.info(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
