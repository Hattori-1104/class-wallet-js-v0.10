import { redirect } from "react-router"
import { getGoogleUser, verifyOauthState } from "~/services/oauth.server"
import { prisma } from "~/services/repository.server"
import {
	_createErrorRedirect,
	commitSession,
	requireSession,
} from "~/services/session.server"

import type { Route } from "./+types/callback"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const url = new URL(request.url)
	const code = url.searchParams.get("code")
	const state = url.searchParams.get("state")
	const session = await requireSession(request)
	const errorRedirect = _createErrorRedirect(session, "/auth")

	if (!code) throw await errorRedirect("codeがありません。").throw()
	if (!state) throw await errorRedirect("stateがありません。").throw()

	const isVerified = await verifyOauthState(request, state)
	if (!isVerified) throw await errorRedirect("stateが一致しません。").throw()

	const googleUser = await getGoogleUser(code)
	if (!googleUser.verified_email)
		throw await errorRedirect("メールアドレスが確認されていません。").throw()

	const userType = session.get("tempUserType") ?? "student"
	try {
		if (userType === "student") {
			const student = await prisma.student.upsert({
				where: { id: googleUser.id },
				create: {
					id: googleUser.id,
					name: googleUser.name,
					email: googleUser.email,
				},
				update: {},
			})
			session.set("user", {
				id: student.id,
				type: "student",
			})
		} else {
			const teacher = await prisma.teacher.upsert({
				where: { id: googleUser.id },
				create: {
					id: googleUser.id,
					name: googleUser.name,
					email: googleUser.email,
				},
				update: {},
			})
			session.set("user", {
				id: teacher.id,
				type: "teacher",
			})
		}
	} catch (e) {
		console.error`${e}`
		throw await errorRedirect("データベースエラーが発生しました。").throw()
	}
	return redirect(`/app/${userType}`, {
		headers: { "Set-Cookie": await commitSession(session) },
	})
}
