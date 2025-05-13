import type { Route } from "./+types/test"

import { data } from "react-router"

export const loader = () => {
	return data("moji")
}

export default ({ loaderData }: Route.ComponentProps) => {
	return <div>{loaderData}</div>
}
