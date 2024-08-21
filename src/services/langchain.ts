import {
	ChatPromptTemplate,
	MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { UpstashRedisChatMessageHistory } from "@langchain/community/stores/message/upstash_redis";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";

const llm = new ChatOpenAI({
	model: "chatgpt-4o-latest",
	temperature: 0,
	maxTokens: undefined,
	timeout: undefined,
	maxRetries: 2,
	apiKey: process.env.OPENAI_API_KEY,
	// other params...
});

const prompt = ChatPromptTemplate.fromMessages([
	[
		"system",
		`You are an AI assistant acting as a restaurant hostess answering phone calls for a restaurant. Your goal is to provide helpful information to customers while maintaining a cordial and professional demeanor. Here is the information about the restaurant:

<restaurant_info>
{RESTAURANT_INFO}
</restaurant_info>

When responding to customer queries, follow these guidelines:
1. Be polite and welcoming in your tone.
2. Provide accurate information based on the restaurant details provided above.
3. If a customer asks about something not covered in the restaurant info, politely inform them that you don't have that information and offer to take a message for the manager.
4. Do not make up any information that is not explicitly stated in the restaurant info.
5. If a customer requests something the restaurant cannot accommodate (e.g., reservations if the restaurant doesn't take them), politely explain the policy and suggest alternatives if possible.
6. Keep your responses concise but informative.

Structure your response as follows:
1. A brief greeting
2. The answer to the customer's query
3. Any additional relevant information
4. A polite closing

Here is the customer's query:

<customer_query>
{customer_query}
</customer_query>

Please respond to the customer's query as a restaurant hostess would, following the guidelines provided.`,
	],
	new MessagesPlaceholder("history"),
	["human", "{customer_query}"],
]);

const chain = prompt.pipe(llm);

const chainWithHistory = new RunnableWithMessageHistory({
	runnable: chain,
	getMessageHistory: (sessionId) =>
		new UpstashRedisChatMessageHistory({
			sessionId,
			sessionTTL: 3600, // 1 hour
			config: {
				url: process.env.UPSTASH_URL,
				token: process.env.UPSTASH_TOKEN,
			},
		}),
	inputMessagesKey: "customer_query",
	historyMessagesKey: "history",
});

export async function getOpenAIResponse(
	transcript: string,
	sessionId: string,
): Promise<string> {
	if (!sessionId) {
		throw new Error("No session ID provided.");
	}

	const completion = await chainWithHistory.invoke(
		{
			customer_query: transcript,
			RESTAURANT_INFO:
				"The restaurant is open from 11:00 AM to 10:00 PM every day. We offer a variety of dishes, including vegetarian and gluten-free options. We do not take reservations, but we have a waitlist system for busy times. Our address is 123 Main St, Anytown, USA.",
		},
		{
			configurable: {
				sessionId,
			},
		},
	);

	if (completion.tool_calls?.length && completion.tool_calls?.length > 0) {
		console.log("Tool calls:", completion.tool_calls);
		return "I'm sorry, I cannot answer that question at the moment.";
	}

	return completion.content as string;
}
