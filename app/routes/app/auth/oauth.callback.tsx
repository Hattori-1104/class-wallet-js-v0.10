import { getGoogleUser, verifyOauthState } from "~/services/oauth.server"
import { prisma } from "~/services/repository.server"
import {
	buildErrorRedirect,
	buildSuccessRedirect,
	requireSession,
} from "~/services/session.server"

import type { Route } from "./+types/oauth.callback"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const url = new URL(request.url)
	const code = url.searchParams.get("code")
	const state = url.searchParams.get("state")
	const session = await requireSession(request)
	const errorRedirect = buildErrorRedirect("/app/auth", session)

	if (!code) return await errorRedirect("OAuth認証：codeがありません。")
	if (!state) return await errorRedirect("OAuth認証：stateがありません。")

	const isVerified = await verifyOauthState(request, state)
	if (!isVerified)
		return await errorRedirect("OAuth認証：stateが一致しません。")

	const googleUser = await getGoogleUser(code)
	if (!googleUser.verified_email)
		return await errorRedirect(
			"OAuth認証：メールアドレスが確認されていません。",
		)

	const userType = session.get("tempUserType")
	if (!userType)
		return await errorRedirect("OAuth認証：ユーザーの種類がありません。")
	try {
		if (userType === "student") {
			const student = await prisma.student.upsert({
				where: { id: googleUser.id },
				create: {
					id: googleUser.id,
					name: googleUser.name,
					email: googleUser.email,
				},
				update: { name: googleUser.name, email: googleUser.email },
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
				update: { name: googleUser.name, email: googleUser.email },
			})
			session.set("user", {
				id: teacher.id,
				type: "teacher",
			})
		}
	} catch (e) {
		console.error`${e}`
		throw await errorRedirect("OAuth認証：データベースエラーが発生しました。")
	}
	session.unset("tempUserType")
	const successRedirect = buildSuccessRedirect(`/app/${userType}`, session)
	return await successRedirect("認証されました。")
}
