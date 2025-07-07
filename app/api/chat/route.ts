import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { ollama } from "ollama-ai-provider";
import {
	streamText,
	tool,
	type UIMessage,
	// , convertToModelMessages
} from "ai";
// import { createAISDKTools } from "@agentic/ai-sdk";
// import { AgenticToolClient } from "@agentic/platform-tool-client";
// import { VercelAIToolSet } from "composio-core";
import { z } from "zod";

import { CloudClient } from "chromadb";
import { errorHandler } from "./errorHandler";

const chromaClient = new CloudClient();
const collection = await chromaClient.getOrCreateCollection({
	name: "user-data",
});

const openai = createOpenAICompatible({
	name: "HackClub AI",
	apiKey: process.env.OPENAI_API_KEY,
	baseURL: process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
});
const toolsetCollection = await chromaClient.getOrCreateCollection({
	name: "toolset",
});

// const toolsetComposio = new VercelAIToolSet();



// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
	// const searchTool = await AgenticToolClient.fromIdentifier("@agentic/search");
	// const wolfram = await AgenticToolClient.fromIdentifier(
	// 	"@agentic/wolfram-alpha",
	// );
	// const { messages }: { messages: UIMessage[] } = await req.json();
	const { messages } = await req.json();

	console.log("Messages received:", messages);

	const result = streamText({
		// model: openai(process.env.OPENAI_MODEL || "gpt-4o-mini"),
		model: ollama("llama3.2"),
		// messages: convertToModelMessages(messages),
		system: `You are a helpful assistant. Check your knowledge base before answering any questions.
    For questions with an answer stored in your knowledgebase use that`,
		messages,
		toolCallStreaming: true,

		tools: {
			getusermemory: tool({
				description: "Get memory about user from the database",
				parameters: z
					.object({
						query: z
							.string()
							.describe("The query to search for in the database"),
						nResults: z
							.number()
							.default(1)
							.describe("Number of results to return"),
					})
					.describe("Parameters for the tool"),
				execute: async ({ query, nResults }) => {
					const memories = await collection.query({
						queryTexts: [query],
						nResults,
					});
					return memories;
				},
			}),
			addUsermemory: tool({
				description: "Add a memory about the user to the database",
				parameters: z
					.object({
						memory: z.string().describe("The memory to add to the database"),
					})
					.describe("Parameters for the tool"),
				execute: async ({ memory }) => {
					await collection.upsert({
						documents: [memory],
						ids: [crypto.randomUUID()],
					});
					return { success: true, message: "Memory added successfully" };
				},
			}),
			searchUserMemory: tool({
				description: "Search for a memory about the user in the database",
				parameters: z
					.object({
						query: z
							.string()
							.describe("The query to search for in the database"),
						nResults: z
							.number()
							.default(1)
							.describe("Number of results to return"),
					})
					.describe("Parameters for the tool"),
				execute: async ({ query, nResults }) => {
					const memories = await collection.query({
						queryTexts: [query],
						nResults,
					});
					return memories;
				},
			}),
			// ...createAISDKTools(searchTool, wolfram),
		},
	});

	
	console.log("Result:", result);

	console.log("datastream response:", result.toDataStreamResponse());
	return result.toDataStreamResponse({
  getErrorMessage: errorHandler,
});
}
