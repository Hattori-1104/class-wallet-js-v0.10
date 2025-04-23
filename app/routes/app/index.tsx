import { redirect } from "react-router"
import { requireSession, verifyUser } from "~/services/session.server"
import type { Route } from "./+types/index"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const user = await verifyUser(session)
	if (user.type === "student") {
		return redirect("/app/student/")
	}
	if (user.type === "teacher") {
		return redirect("/app/teacher/")
	}
}
