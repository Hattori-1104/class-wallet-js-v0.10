import { redirect } from "react-router"
import { z } from "zod"
import { getGoogleAuthUrl, setOauthState } from "~/services/oauth.server"
import { commitSession } from "~/services/session.server"
import type { Route } from "./+types/index"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const { success, data } = z.enum(["student", "teacher"]).safeParse(new URL(request.url).searchParams.get("user-type"))
	const userType = success ? data : "student"

	const { state, session } = await setOauthState(request)
	session.set("tempUserType", userType)
	const authUrl = getGoogleAuthUrl(state)
	return redirect(authUrl, { headers: { "Set-Cookie": await commitSession(session) } })
}
