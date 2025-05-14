import { redirect } from "react-router"
import { prisma } from "~/services/repository.server"
import { entryPartRoute } from "~/services/route-module.server"
import { errorBuilder } from "~/services/session.server"
import type { Route } from "./+types/router"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	// セッション情報の取得 & 検証
	const { partId, session, student } = await entryPartRoute(
		request,
		params.partId,
	)
	const errorRedirect = errorBuilder(`/app/student/part/${partId}`, session)

	if (!partId) return await errorRedirect("パートに所属していません。")

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
				label: true,
				description: true,
				plannedUsage: true,
				updatedAt: true,

				isCanceled: true,
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

	const approvalPageUrl = `/app/student/part/${partId}/purchase/${purchase.id}/approval`
	const completionPageUrl = `/app/student/part/${partId}/purchase/${purchase.id}/completion`
	const receiptSubmissionPageUrl = `/app/student/part/${partId}/purchase/${purchase.id}/receipt-submission`

	if (purchase.isCanceled) {
		return redirect(approvalPageUrl)
	}
	if (
		purchase.accountantApproval?.approved !== true ||
		purchase.teacherApproval?.approved !== true
	) {
		return redirect(approvalPageUrl)
	}
	if (!purchase.completion) {
		return redirect(completionPageUrl)
	}

	return redirect(receiptSubmissionPageUrl)
}
