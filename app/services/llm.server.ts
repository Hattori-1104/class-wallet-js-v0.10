import {} from "ollama"
import { OpenAI } from "openai"

const API_KEY = process.env.LLM_API_KEY || "ollama"
const MODEL = process.env.LLM_MODEL || "ollama/gemma3:1b"

const openai = new OpenAI({
	apiKey: API_KEY,
	baseURL: "http://localhost:11434/v1",
})

export const llmTest = async () => {
	const response = await openai.chat.completions.create({
		model: MODEL,
		messages: [{ role: "user", content: "Hello, how are you?" }],
	})

	return response.choices[0].message.content
}
