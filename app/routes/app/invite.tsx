import { redirect } from "react-router"
import { prisma } from "~/services/repository.server"
import { commitSession, requireSession } from "~/services/session.server"
import type { Route } from "./+types/invite"

export const loader = async ({ params, request }: Route.LoaderArgs) => {
	const { walletId, partId } = params
	const session = await requireSession(request)

	const user = session.get("user")
	if (!user) {
		session.flash("error", { message: "ログインしてください" })
		return redirect("/app/auth", {
			headers: { "Set-Cookie": await commitSession(session) },
		})
	}
	// 生徒
	if (user.type === "student") {
		const studentId = user.id

		// パートへの参加
		if (partId) return redirect(`/app/student/part/${partId}/invite`)

		// ウォレットへ会計として参加
		try {
			const wallet = await prisma.wallet.update({
				where: { id: walletId },
				data: { accountantStudents: { connect: { id: studentId } } },
				select: { id: true, name: true },
			})
			session.flash("success", {
				message: `${wallet.name} に会計として参加しました。`,
			})
			return redirect(`/app/student/accountant/${wallet.id}`, {
				headers: { "Set-Cookie": await commitSession(session) },
			})
		} catch (error: unknown) {
			console.error(error)
			session.flash("error", { message: "ウォレットの参加に失敗しました。" })
			return redirect("/app/student", {
				headers: { "Set-Cookie": await commitSession(session) },
			})
		}
	}
	// 教師
	if (user.type === "teacher") {
		const teacherId = user.id

		try {
			const wallet = await prisma.wallet.update({
				where: { id: walletId },
				data: { teachers: { connect: { id: teacherId } } },
				select: { id: true, name: true },
			})
			session.flash("success", {
				message: `${wallet.name} に教師として参加しました。`,
			})
			return redirect(`/app/teacher/wallet/${wallet.id}`, {
				headers: { "Set-Cookie": await commitSession(session) },
			})
		} catch (error: unknown) {
			console.error(error)
			session.flash("error", { message: "ウォレットの参加に失敗しました。" })
			return redirect("/app/teacher", {
				headers: { "Set-Cookie": await commitSession(session) },
			})
		}
	}
}
