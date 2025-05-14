import { redirect } from "react-router"
import { requireSession } from "~/services/session.server"
import type { Route } from "./+types/router"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const user = await session.get("user")
	if (!user) {
		return redirect("/app/auth")
	}
	if (user.type === "student") {
		return redirect("/app/student")
	}
	if (user.type === "teacher") {
		return redirect("/app/teacher")
	}
}
