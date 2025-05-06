import { ReceiptSubmission } from "~/components/page/purchase/receipt-submission"
import { purchaseStateSelectQuery } from "~/services/repository.server"
import { prisma } from "~/services/repository.server"
import { createErrorRedirect, createSuccessRedirect, verifyStudent } from "~/services/session.server"
import { requireSession } from "~/services/session.server"
import type { Route } from "./+types/receipt-submission"

const serverCommon = async ({ params: { partId, purchaseId }, request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	const purchase = await prisma.purchase.findUniqueOrThrow({
		where: { id: purchaseId, part: { id: partId } },
		include: {
			state: {
				select: purchaseStateSelectQuery(),
			},
		},
	})
	const isRequester = (() => {
		if (!purchase.state.request) {
			return false
		}
		return purchase.state.request.by.id === student.id
	})()
	return { session, student, purchase, isRequester }
}

export const loader = async (loaderArgs: Route.LoaderArgs) => {
	const { isRequester, purchase } = await serverCommon(loaderArgs)
	return { isRequester, purchase }
}

export default ({ loaderData: { isRequester, purchase } }: Route.ComponentProps) => {
	return <ReceiptSubmission isRequester={isRequester} purchase={purchase} />
}

export const action = async (actionArgs: Route.ActionArgs) => {
	const { session, student, isRequester } = await serverCommon(actionArgs)
	const { partId, purchaseId } = actionArgs.params
	const errorRedirect = createErrorRedirect(
		session,
		`/app/student/part/${partId}/purchase/${purchaseId}/receiptSubmission`,
	)
	if (!isRequester) {
		return await errorRedirect("レシート提出を行う権限がありません。").throw()
	}
	const formData = await actionArgs.request.formData()
	const successRedirect = createSuccessRedirect(
		session,
		`/app/student/part/${partId}/purchase/${purchaseId}/receiptSubmission`,
	)
	if (formData.get("submit") === "submit") {
		const purchases = await prisma.purchase.findMany({
			where: {
				part: {
					wallet: {
						parts: {
							some: {
								id: partId,
							},
						},
					},
				},
			},
			select: {
				state: {
					select: {
						receiptSubmission: {
							select: {
								receiptIndex: true,
							},
						},
					},
				},
			},
		})
		const availableReceiptIndex = (() => {
			let available = 1
			for (const purchase of purchases) {
				if (purchase.state.receiptSubmission?.receiptIndex === available) {
					available++
				}
			}
			return available
		})()
		await prisma.purchase
			.update({
				where: { id: purchaseId },
				data: {
					state: {
						update: {
							receiptSubmission: {
								upsert: {
									create: {
										receiptIndex: availableReceiptIndex,
									},
									update: {
										receiptIndex: availableReceiptIndex,
									},
								},
							},
						},
					},
				},
			})
			.catch(errorRedirect("レシート提出に失敗しました。").catch())
		return await successRedirect("レシート提出を提出しました。")
	}
	return null
}
