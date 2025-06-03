import { redirect } from "react-router"
import { entryTeacherRoute } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import { errorBuilder } from "~/services/session.server"
import { PurchaseState } from "~/utilities/purchase-state"
import type { Route } from "./+types/router"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	// セッション情報の取得 & 検証
	const { walletId, session, teacher } = await entryTeacherRoute(
		request,
		params.walletId,
		false,
	)
	const errorRedirect = errorBuilder(`/app/teacher/wallet/${walletId}`, session)

	// データ取得
	// 状態の検証
	const purchase = await prisma.purchase
		.findUniqueOrThrow({
			where: {
				id: params.purchaseId,
				part: {
					wallet: {
						teachers: { some: { id: teacher.id } },
					},
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
		`/app/teacher/wallet/${walletId}/purchase/${purchase.id}/${pageRoute}`,
	)
}
