import { Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { entryStudentRoute } from "~/route-modules/common.server"
import { PurchaseApprovalSectionContent } from "~/route-modules/purchase-state/approval"
import { PurchaseApprovalSelectQuery } from "~/route-modules/purchase-state/approval.server"
import { queryIsStudentInCharge } from "~/route-modules/purchase-state/common.server"
import { prisma } from "~/services/repository.server"
import { sendPushNotification } from "~/services/send-notification.server"
import { buildErrorRedirect, buildSuccessRedirect } from "~/services/session.server"
import type { Route } from "./+types/approval"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	// セッション情報の取得 & 検証
	const { partId, session, student } = await entryStudentRoute(request, params.partId)
	const errorRedirect = buildErrorRedirect(`/app/student/part/${partId}`, session)

	// データ取得
	const purchase = await prisma.purchase
		.findUniqueOrThrow({
			where: {
				id: params.purchaseId,
				part: {
					id: partId,
					students: { some: { id: student.id } },
				},
			},
			select: PurchaseApprovalSelectQuery,
		})
		.catch(() => errorRedirect("購入情報が見つかりません。"))
	const isInCharge = await queryIsStudentInCharge(partId, student.id)
	return { purchase, isInCharge }
}

export default ({ loaderData }: Route.ComponentProps) => {
	return (
		<Section>
			<SectionTitle>
				<Title>購入承認</Title>
			</SectionTitle>
			<PurchaseApprovalSectionContent
				purchase={loaderData.purchase}
				isInCharge={loaderData.isInCharge}
				userType="student"
			/>
		</Section>
	)
}

export const action = async ({ request, params }: Route.ActionArgs) => {
	const { partId, session, student } = await entryStudentRoute(request, params.partId)
	const errorRedirect = buildErrorRedirect(`/app/student/part/${partId}`, session)

	const isInCharge = await queryIsStudentInCharge(partId, student.id)
	if (!isInCharge) return await errorRedirect("権限がありません。")

	const formData = await request.formData()
	const action = formData.get("action")

	if (action !== "approve" && action !== "reject") {
		return null
	}

	const successRedirect = buildSuccessRedirect(`/app/student/part/${partId}/purchase/${params.purchaseId}`, session)

	try {
		const purchase = await prisma.purchase.update({
			where: { id: params.purchaseId },
			data: {
				accountantApproval: {
					upsert: {
						update: {
							by: { connect: { id: student.id } },
							approved: action === "approve",
						},
						create: {
							by: { connect: { id: student.id } },
							approved: action === "approve",
						},
					},
				},
			},
			select: {
				label: true,
				accountantApproval: {
					select: {
						by: {
							select: {
								name: true,
							},
						},
					},
				},
				requestedBy: {
					select: {
						id: true,
						name: true,
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
			title: `会計による${action === "approve" ? "承認" : "拒否"}`,
			body: `（${purchase.part.wallet.name}）${purchase.part.name} ${purchase.accountantApproval?.by.name ?? "??"} ${purchase.label}`,
		})
		return await successRedirect(action === "approve" ? "承認しました。" : "拒否しました。")
	} catch (_) {
		return await errorRedirect("承認に失敗しました。")
	}
}
