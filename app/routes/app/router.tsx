import { redirect } from "react-router"
import { requireSession } from "~/services/session.server"
import type { Route } from "./+types/router"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const url = new URL(request.url)
	const user = await session.get("user")
	if (!user) {
		url.pathname = "/app/auth"
	} else if (user.type === "student") {
		url.pathname = "/app/student"
	} else if (user.type === "teacher") {
		url.pathname = "/app/teacher"
	}
	return redirect(url.toString())
}
