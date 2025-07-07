import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { ollama } from "ollama-ai-provider";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import {
	streamText,
	tool,
	// type UIMessage,
	simulateReadableStream,
	embed,
	// , convertToModelMessages
} from "ai";
import { jsonSchema } from "@/lib/types";
// import { createAISDKTools } from "@agentic/ai-sdk";
// import { AgenticToolClient } from "@agentic/platform-tool-client";
// import { VercelAIToolSet } from "composio-core";
import { z } from "zod";

import { errorHandler } from "./errorHandler";
import { MockLanguageModelV1 } from "ai/test";
import { json } from "stream/consumers";

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
	const cookieStore = cookies();
	const supabase = createClient(cookieStore);

	console.log("Messages received:", messages);

	const result = streamText({
		// model: openai(process.env.OPENAI_MODEL || "gpt-4o-mini"),
		// model: ollama("llama3.2"),
		model: new MockLanguageModelV1({
			doStream: async () => ({
				stream: simulateReadableStream({
					chunks: [
						{ type: "text-delta", textDelta: "Hello" },
						{ type: "text-delta", textDelta: ", " },
						{ type: "text-delta", textDelta: "world!" },
						{
							type: "finish",
							finishReason: "stop",
							logprobs: undefined,
							usage: { completionTokens: 10, promptTokens: 3 },
						},
					],
				}),
				rawCall: { rawPrompt: null, rawSettings: {} },
			}),
		}),
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
						name: z.string().describe("The memory name to add to the database"),
						json_data: jsonSchema,
						metadata: jsonSchema.describe("Additional JSON data to store with the memory"),
					})
					.describe("Parameters for the tool"),
				execute: async ({ memory, name, json_data, metadata }) => {
					const input = memory.replace(/\n/g, " ");
					const { embedding, usage } = await embed({
						model: ollama.embedding("text-embedding-3-small"),
						value: input,
					});
					// In production we should handle possible errors
					await supabase.from("user_memories").insert({
						name,
						// user_id: supabase.auth.user()?.id,
						text_content: memory,
						embedding,
						data: json_data,
						model_name: "text-embedding-3-small",
						metadata
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

	return result.toDataStreamResponse({
		getErrorMessage: errorHandler,
	});
}
