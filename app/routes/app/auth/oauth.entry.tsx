import { parseWithZod } from "@conform-to/zod"
import { redirect, redirectDocument } from "react-router"
import { z } from "zod"
import { getGoogleAuthUrl, setOauthState } from "~/services/oauth.server"
import {
	commitSession,
	errorBuilder,
	requireSession,
} from "~/services/session.server"
import type { Route } from "./+types/oauth.entry"

const FormSchema = z.object({
	userType: z.enum(["student", "teacher"]),
})

export const loader = () => redirect("/app/auth")

export const action = async ({ request }: Route.ActionArgs) => {
	const session = await requireSession(request)
	const errorRedirect = errorBuilder("/app/auth", session)
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: FormSchema })

	if (submission.status !== "success")
		return await errorRedirect("OAuth認証：ユーザータイプが不明です。")

	const state = setOauthState(session)
	session.set("tempUserType", submission.value.userType)
	const authUrl = getGoogleAuthUrl(state)
	return redirectDocument(authUrl, {
		headers: { "Set-Cookie": await commitSession(session) },
	})
}
