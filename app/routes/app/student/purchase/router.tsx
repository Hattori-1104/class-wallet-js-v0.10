import { redirect } from "react-router"
import { prisma } from "~/services/repository.server"
import { buildErrorRedirect, requireSession } from "~/services/session.server"
import { recommendedAction } from "~/utilities/purchase-state"
import type { Route } from "./+types/router"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	// セッション情報の取得 & 検証
	const session = await requireSession(request)
	const user = session.get("user")
	const errorRedirect = buildErrorRedirect(`/app/student/part/${params.partId}`, session)
	if (!user) return await errorRedirect("ログインしてください。")
	if (user.type !== "student") return await errorRedirect("生徒ではありません。")
	const student = user
	// データ取得
	// 状態の検証
	const purchase = await prisma.purchase
		.findUniqueOrThrow({
			where: {
				id: params.purchaseId,
				part: {
					wallet: {
						parts: {
							some: {
								students: {
									some: {
										id: student.id,
									},
								},
							},
						},
					},
				},
			},
			select: {
				id: true,
				canceled: true,
				part: {
					select: {
						id: true,
					},
				},
				accountantApproval: {
					select: {
						approved: true,
					},
				},
				teacherApproval: {
					select: {
						approved: true,
					},
				},
				completion: {
					select: {
						actualUsage: true,
					},
				},
				receiptSubmission: {
					select: {
						receiptIndex: true,
					},
				},
			},
		})
		.catch(() => errorRedirect("購入データが見つかりません。"))

	const pageRoute = recommendedAction(purchase).replace("completed", "receiptSubmission")
	return redirect(`/app/student/part/${purchase.part.id}/purchase/${purchase.id}/${pageRoute}`)
}
