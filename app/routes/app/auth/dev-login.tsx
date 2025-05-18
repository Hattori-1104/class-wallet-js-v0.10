import { redirect } from "react-router"
import { commitSession, requireSession } from "~/services/session.server"
import type { Route } from "./+types/dev-login"

export const action = async ({ request }: Route.ActionArgs) => {
	const session = await requireSession(request)
	session.set("user", { type: "student", id: "dev-student" })
	return redirect("/app", {
		headers: {
			"Set-Cookie": await commitSession(session),
		},
	})
}

export const loader = action
