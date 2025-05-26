import { redirect } from "react-router"
import { prisma } from "~/services/repository.server"
import { entryStudentRoute } from "~/services/route-module.server"
import { errorBuilder } from "~/services/session.server"
import { PurchaseState } from "~/utilities/purchase-state"
import type { Route } from "./+types/router"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	// セッション情報の取得 & 検証
	const { partId, session, student } = await entryStudentRoute(
		request,
		params.partId,
	)
	const errorRedirect = errorBuilder(`/app/student/part/${partId}`, session)

	// データ取得
	// 状態の検証
	const purchase = await prisma.purchase
		.findUniqueOrThrow({
			where: {
				id: params.purchaseId,
				part: {
					id: partId,
					students: { some: { id: student.id } },
				},
			},
			select: {
				id: true,
				canceled: true,
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

	const purchaseState = new PurchaseState(purchase)
	const pageRoute = purchaseState.recommendedAction
	return redirect(
		`/app/student/part/${partId}/purchase/${purchase.id}/${pageRoute}`,
	)
}
