import z from "zod";
import { t } from "elysia";
import env from "@/utils/env";
import { logger } from "@/utils/logger";
import {
	ChatPromptTemplate,
	MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { UpstashRedisChatMessageHistory } from "@langchain/community/stores/message/upstash_redis";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { tool } from "@langchain/core/tools";
import type { BindToolsInput } from "@langchain/core/language_models/chat_models";
import { ToolFactory, type ToolsObject } from "@/agents/tool.factory";

const openAiChat = new ChatOpenAI({
	model: "gpt-4o",
	temperature: 0,
	maxTokens: undefined,
	timeout: undefined,
	maxRetries: 2,
	apiKey: env.OPENAI_API_KEY,
});

const AnthropicChat = new ChatAnthropic({
	model: "claude-3-5-sonnet-20240620",
	temperature: 0,
	maxTokens: undefined,
	maxRetries: 2,
	apiKey: env.ANTHROPIC_API_KEY,
});

const prompt = ChatPromptTemplate.fromMessages([
	[
		"system",
		`You are Elysia, an AI restaurant hostess. Interact with customers via phone calls and SMS in a friendly, professional manner. Provide excellent customer service based on the restaurant information provided.

<restaurant_info>
{restaurant_info}
</restaurant_info>

Communication Guidelines:
- Customer messages are tagged as <call>message</call> for phone calls or <sms phone="customer_phone_number">message</sms> for SMS.
- Never include these tags in your own responses. Respond in untagged sentences.
- Tailor your response to the communication channel, considering its limitations and characteristics.
- Use a warm, welcoming tone and conversational language.
- Speak in concise, complete sentences.
- Show enthusiasm for the restaurant and its offerings.
- Be patient and understanding with customer inquiries.
- If asked about information not in the restaurant info, politely inform them you don't have that information and offer to take a message for the manager.
- Consider the conversation history to maintain context and avoid repetition.
- When asked about directions, store location, or similar tell them the address then send an SMS using the sendSMS tool

Response Format:
1. If this is the first interaction, start with a greeting and introduction.
		1a. Only include the introduction once per conversation
2. Address the customer's query directly.
3. If appropriate, ask if there's anything else you can help with.

Ensure your responses sound natural and conversational, as if spoken over the phone or via SMS.
 
`,
	],
	new MessagesPlaceholder("history"),
	["human", "{customer_query}"],
]);

export async function updateHistory(
	sessionId: string,
	message: string,
): Promise<void> {
	const history = new UpstashRedisChatMessageHistory({
		sessionId,
		sessionTTL: 3600, // 1 hour
		config: {
			url: env.UPSTASH_URL,
			token: env.UPSTASH_TOKEN,
		},
	});

	await history.addUserMessage(message);
}

export async function getOpenAIResponse(
	sessionId: string,
	transcript: string,
	restaurant_info: string,
	{ tools, toolsByName }: ToolsObject = ToolFactory.emptyTools,
): Promise<string> {
	if (!sessionId) {
		throw new Error("No session ID provided.");
	}

	const base = openAiChat.bindTools(tools);
	const userPromptChain = prompt.pipe(base);

	const history = new UpstashRedisChatMessageHistory({
		sessionId,
		sessionTTL: 3600, // 1 hour
		config: {
			url: env.UPSTASH_URL,
			token: env.UPSTASH_TOKEN,
		},
	});

	const chainWithHistory = new RunnableWithMessageHistory({
		runnable: userPromptChain,
		getMessageHistory: () => history,
		inputMessagesKey: "customer_query",
		historyMessagesKey: "history",
	});
	const mesages = await history.getMessages();
	logger.info(mesages, "History:");
	const completion = await chainWithHistory.invoke(
		{
			customer_query: transcript,
			date: new Date().toISOString(),
			restaurant_info,
		},
		{
			configurable: {
				sessionId,
			},
		},
	);

	if (completion.tool_calls?.length && completion.tool_calls?.length > 0) {
		const selectedToolCall = completion.tool_calls[0];
		logger.info(selectedToolCall.args, "Tool calls:");

		const toolMessage =
			await toolsByName[selectedToolCall.name].invoke(selectedToolCall);

		logger.info(toolMessage, "Tool message:");

		await history.addMessage(toolMessage);
		const messages = await history.getMessages();

		const toolCompletion = await base.invoke(messages);
		await history.addMessage(toolCompletion);

		return toolCompletion.content as string;
	}

	return completion.content as string;
}

export async function* getResponseStream(
	sessionId: string,
	transcript: string,
	restaurant_info: string,
	{ tools, toolsByName }: ToolsObject = ToolFactory.emptyTools,
	chunkSize = 100000, // Adjust the chunk size as needed
) {
	if (!sessionId) {
		throw new Error("No session ID provided.");
	}

	const base = openAiChat;
	const userPromptChain = prompt.pipe(base);

	const history = new UpstashRedisChatMessageHistory({
		sessionId,
		sessionTTL: 3600, // 1 hour
		config: {
			url: env.UPSTASH_URL,
			token: env.UPSTASH_TOKEN,
		},
	});

	const chainWithHistory = new RunnableWithMessageHistory({
		runnable: userPromptChain,
		getMessageHistory: () => history,
		inputMessagesKey: "customer_query",
		historyMessagesKey: "history",
	});

	const completion = await chainWithHistory.stream(
		{
			customer_query: transcript,
			date: new Date().toISOString(),
			restaurant_info,
		},
		{
			configurable: {
				sessionId,
			},
		},
	);

	let buffer = "";

	for await (const message of completion) {
		if (message.content !== "") {
			buffer += message.content;

			if (buffer.length >= chunkSize) {
				yield buffer;
				buffer = "";
			}
		}
	}

	if (buffer.length > 0) {
		yield buffer;
	}
}
