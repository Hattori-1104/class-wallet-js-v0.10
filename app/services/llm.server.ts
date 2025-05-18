import { OpenAI } from "openai"

const API_KEY = process.env.LLM_API_KEY || "ollama"
const MODEL = process.env.LLM_MODEL || "ollama/gemma3:1b-it-qat"

const openai = new OpenAI({
	baseURL: "http://localhost:11434/v1",
	apiKey: API_KEY,
})

export const llmTest = () => {
	const response = openai.chat.completions.create({
		model: MODEL,
		messages: [{ role: "user", content: "こんにちは" }],
	})

	return response
}

// export const llmTest = () => {
// 	const response = ollama.chat({
// 		model: "gemma3",
// 		messages: [{ role: "user", content: "こんにちは" }],
// 	})
// 	return response
// }
