import { Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { entryStudentPurchaseRoute } from "~/route-modules/common.server"
import { queryIsRequester, queryIsStudentInCharge } from "~/route-modules/purchase-state/common.server"
import { PurchaseReceiptSubmissionSectionContent } from "~/route-modules/purchase-state/receipt-submission"
import { PurchaseReceiptSubmissionSelectQuery } from "~/route-modules/purchase-state/receipt-submission.server"
import { prisma } from "~/services/repository.server"
import { sendPushNotification } from "~/services/send-notification.server"
import { buildErrorRedirect, buildSuccessRedirect } from "~/services/session.server"
import type { Route } from "./+types/receipt-submission"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { session, partId, student, purchaseId } = await entryStudentPurchaseRoute(request, params.purchaseId)
	const isAccountant = await queryIsStudentInCharge(partId, student.id)
	const isRequester = await queryIsRequester(purchaseId, student.id)
	const errorRedirect = buildErrorRedirect(`/app/student/part/${partId}/purchase/${purchaseId}`, session)
	const purchase = await prisma.purchase
		.findUniqueOrThrow({
			where: { id: purchaseId },
			select: PurchaseReceiptSubmissionSelectQuery,
		})
		.catch(() => errorRedirect("購入が見つかりません"))
	return { purchase, isAccountant, isRequester }
}

export default ({ loaderData }: Route.ComponentProps) => {
	const { purchase, isAccountant, isRequester } = loaderData
	return (
		<Section>
			<SectionTitle>
				<Title>レシート提出</Title>
			</SectionTitle>
			<PurchaseReceiptSubmissionSectionContent
				purchase={purchase}
				isAccountant={isAccountant}
				isRequester={isRequester}
			/>
		</Section>
	)
}

export const action = async ({ request, params }: Route.ActionArgs) => {
	const { session, partId, student, purchaseId } = await entryStudentPurchaseRoute(request, params.purchaseId)
	const errorRedirect = buildErrorRedirect(`/app/student/part/${partId}/purchase/${purchaseId}`, session)
	const formData = await request.formData()
	const accepted = formData.get("receiptSubmission") === "accepted"
	if (!accepted) {
		return errorRedirect("レシートが見つかりません")
	}

	const isInCharge = await queryIsStudentInCharge(partId, student.id)
	if (!isInCharge) {
		return errorRedirect("権限がありません")
	}

	const receiptIndex =
		(await prisma.purchase.count({
			where: {
				receiptSubmission: { isNot: null },
				id: { not: purchaseId },
				part: { wallet: { parts: { some: { id: partId } } } },
			},
		})) + 1

	const purchase = await prisma.purchase
		.update({
			where: { id: purchaseId },
			data: {
				receiptSubmission: {
					upsert: {
						create: {
							receiptIndex,
							submittedTo: {
								connect: {
									id: student.id,
								},
							},
						},
						update: {
							receiptIndex,
							submittedTo: {
								connect: {
									id: student.id,
								},
							},
						},
					},
				},
			},
			select: {
				label: true,
				requestedBy: {
					select: {
						id: true,
						name: true,
					},
				},
				receiptSubmission: {
					select: {
						receiptIndex: true,
					},
				},
				part: {
					select: {
						name: true,
						wallet: {
							select: {
								name: true,
							},
						},
					},
				},
			},
		})
		.catch(() => errorRedirect("レシート提出に失敗しました。"))
	const subscriptions = (
		await prisma.subscription.findMany({
			where: {
				OR: [
					{ student: { id: purchase.requestedBy.id } },
					{ student: { wallets: { some: { parts: { some: { id: partId } } } } } },
					{ teacher: { wallets: { some: { parts: { some: { id: partId } } } } } },
				],
			},
			select: {
				endpoint: true,
				auth: true,
				p256dh: true,
			},
		})
	).map((sub) => ({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }))
	sendPushNotification(subscriptions, {
		title: `レシートの提出 - 番号：${purchase.receiptSubmission?.receiptIndex}`,
		body: `（${purchase.part.wallet.name}）${purchase.part.name} ${purchase.requestedBy.name} ${purchase.label}`,
	})

	const successRedirect = buildSuccessRedirect(`/app/student/part/${partId}/purchase/${purchaseId}`, session)
	return successRedirect(`レシートを提出しました。番号：${purchase.receiptSubmission?.receiptIndex}`)
}
