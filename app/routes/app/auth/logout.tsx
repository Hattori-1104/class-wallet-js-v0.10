import { redirect } from "react-router"
import { commitSession, requireSession } from "~/services/session.server"
import type { Route } from "./+types/logout"

export const action = async ({ request }: Route.ActionArgs) => {
	const session = await requireSession(request)
	session.unset("user")
	session.flash("success", { message: "ログアウトしました。" })
	return redirect("/app/auth/login", {
		headers: { "Set-Cookie": await commitSession(session) },
	})
}

export const loader = action
