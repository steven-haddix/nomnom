import { Schema, Repository } from "redis-om";
import { redis } from "./redis";

export const callSchema = new Schema(
	"voice-call",
	{
		provider: { type: "string", field: "provider" },
		from: { type: "string", field: "from" },
		to: { type: "string", field: "to" },
		callId: { type: "string", field: "callId" },
	},
	{},
);

export const callRepository = new Repository(callSchema, redis);
