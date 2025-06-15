import { Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { entryTeacherRoute } from "~/route-modules/common.server"
import { PurchaseApprovalSectionContent } from "~/route-modules/purchase-state/approval"
import { PurchaseApprovalSelectQuery } from "~/route-modules/purchase-state/approval.server"
import { prisma } from "~/services/repository.server"
import { sendPushNotification } from "~/services/send-notification.server"
import { buildErrorRedirect, buildSuccessRedirect } from "~/services/session.server"
import type { Route } from "./+types/approval"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	// セッション情報の取得 & 検証
	const { walletId, session, teacher } = await entryTeacherRoute(request, params.walletId)
	const errorRedirect = buildErrorRedirect(`/app/teacher/wallet/${walletId}`, session)

	// データ取得
	const purchase = await prisma.purchase
		.findUniqueOrThrow({
			where: {
				id: params.purchaseId,
				part: {
					wallet: {
						id: walletId,
						teachers: { some: { id: teacher.id } },
					},
				},
			},
			select: PurchaseApprovalSelectQuery,
		})
		.catch(() => errorRedirect("購入情報が見つかりません。"))
	return { purchase }
}

export default ({ loaderData }: Route.ComponentProps) => {
	return (
		<Section>
			<SectionTitle>
				<Title>購入承認</Title>
			</SectionTitle>
			<PurchaseApprovalSectionContent purchase={loaderData.purchase} isInCharge={true} userType="teacher" />
		</Section>
	)
}

export const action = async ({ request, params }: Route.ActionArgs) => {
	const { walletId, session, teacher } = await entryTeacherRoute(request, params.walletId)

	const formData = await request.formData()
	const action = formData.get("action")

	if (action !== "approve" && action !== "reject") {
		return null
	}

	const errorRedirect = buildErrorRedirect(`/app/teacher/wallet/${walletId}`, session)
	const successRedirect = buildSuccessRedirect(`/app/teacher/wallet/${walletId}/purchase/${params.purchaseId}`, session)

	try {
		const purchase = await prisma.purchase
			.update({
				where: { id: params.purchaseId },
				data: {
					teacherApproval: {
						upsert: {
							update: {
								by: { connect: { id: teacher.id } },
								approved: action === "approve",
							},
							create: {
								by: { connect: { id: teacher.id } },
								approved: action === "approve",
							},
						},
					},
				},
				select: {
					label: true,
					teacherApproval: {
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
			.catch(() => errorRedirect("購入の承認に失敗しました。"))

		const subscriptions = (
			await prisma.subscription.findMany({
				where: {
					OR: [
						{ student: { id: purchase.requestedBy.id } },
						{ student: { wallets: { some: { id: walletId } } } },
						{ teacher: { wallets: { some: { id: walletId } } } },
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
			title: `教師による${action === "approve" ? "承認" : "拒否"}`,
			body: `（${purchase.part.wallet.name}）${purchase.part.name} ${purchase.teacherApproval?.by.name ?? "??"} ${purchase.label}`,
		})
		return successRedirect("購入を承認しました。")
	} catch (_) {
		return await errorRedirect("承認に失敗しました。")
	}
}
