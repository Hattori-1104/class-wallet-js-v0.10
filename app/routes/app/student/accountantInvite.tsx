import { verifyStudent } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import { buildSuccessRedirect, requireSession } from "~/services/session.server"
import { buildErrorRedirect } from "~/services/session.server"
import type { Route } from "./+types/accountantInvite"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)

	const errorRedirect = buildErrorRedirect("/app/student/part", session)

	const wallet = await prisma.wallet
		.update({
			where: {
				id: params.walletId,
			},
			data: {
				accountantStudents: {
					connect: {
						id: student.id,
					},
				},
			},
		})
		.catch(() =>
			errorRedirect("HR会計としてのウォレットの参加に失敗しました。"),
		)
	const successRedirect = buildSuccessRedirect(
		`/app/student/accountant/${wallet.id}`,
		session,
	)
	return successRedirect("HR会計としてのウォレットの参加に成功しました。")
}
