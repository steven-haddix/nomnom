import { Type, type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

// Define the schema for your environment variables
const envSchema = Type.Object({
	NOMNOM_API_URL: Type.String(),
	NOMNOM_WS_URL: Type.String(),
	DATABASE_URL: Type.String(),
	TWILIO_ACCOUNT_SID: Type.String(),
	TWILIO_APP_SID: Type.String(),
	TWILIO_AUTH_TOKEN: Type.String(),
	TWILIO_API_SID: Type.String(),
	TWILIO_API_SECRET: Type.String(),
	TELNYX_API_KEY: Type.String(),
	OPENAI_API_KEY: Type.String(),
	ANTHROPIC_API_KEY: Type.String(),
	DEEPGRAM_API_KEY: Type.String(),
	UPSTASH_URL: Type.String(),
	UPSTASH_TOKEN: Type.String(),
	UPSTASH_REDIS_URL: Type.String(),
});

// Validate the environment variables against the schema
const env = Value.Parse(envSchema, process.env);

// Export the typed environment variables
export default env as Static<typeof envSchema>;
