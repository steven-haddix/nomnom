import { createClient } from "redis";
import env from "@/utils/env";

export const redis = createClient({
	url: env.UPSTASH_REDIS_URL,
});
redis.on("error", (err) => console.log("Redis Client Error", err));
await redis.connect();
