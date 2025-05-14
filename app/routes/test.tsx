import { data } from "react-router"
import { llmTest } from "~/services/llm.server"
import type { Route } from "./+types/test"

export const loader = async () => {
	const response = await llmTest()
	return data(response)
}

export default ({ loaderData }: Route.ComponentProps) => {
	return <div>{loaderData}</div>
}
