import { Section, SectionTitle } from "~/components/common/container"
import { prisma } from "~/services/repository.server"
import { entryTeacherRoute } from "~/services/route-module.server"
import { errorBuilder, successBuilder } from "~/services/session.server"
import { PurchaseApprovalSectionContent } from "~/super-modules/purchase/approval"
import { PurchaseApprovalSelectQuery } from "~/super-modules/purchase/approval.server"
import { queryIsInCharge } from "~/super-modules/purchase/common"
import type { Route } from "./+types/approval"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	// セッション情報の取得 & 検証
	const { walletId, session, teacher } = await entryTeacherRoute(
		request,
		params.walletId,
	)
	const errorRedirect = errorBuilder(`/app/teacher/wallet/${walletId}`, session)

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
	const isInCharge = await queryIsInCharge({
		type: "teacher",
		walletId,
		teacherId: teacher.id,
	})
	return { purchase, isInCharge }
}

export default ({ loaderData }: Route.ComponentProps) => {
	return (
		<Section>
			<SectionTitle>購入承認</SectionTitle>
			<PurchaseApprovalSectionContent
				purchase={loaderData.purchase}
				isInCharge={loaderData.isInCharge}
				userType="teacher"
			/>
		</Section>
	)
}

export const action = async ({ request, params }: Route.ActionArgs) => {
	const { walletId, session, teacher } = await entryTeacherRoute(
		request,
		params.walletId,
	)
	const errorRedirect = errorBuilder(`/app/teacher/wallet/${walletId}`, session)

	const isInCharge = await queryIsInCharge({
		type: "teacher",
		walletId,
		teacherId: teacher.id,
	})
	if (!isInCharge) return await errorRedirect("権限がありません。")

	const formData = await request.formData()
	const action = formData.get("action")
	const successRedirect = successBuilder(
		`/app/teacher/wallet/${walletId}/purchase/${params.purchaseId}`,
		session,
	)
	if (action === "reject") {
		await prisma.purchase
			.update({
				where: { id: params.purchaseId },
				data: {
					teacherApproval: {
						update: {
							by: { connect: { id: teacher.id } },
							approved: false,
						},
					},
				},
			})
			.catch(() => errorRedirect("購入の拒否に失敗しました。"))
		return successRedirect("購入を拒否しました。")
	}
	if (action === "approve") {
		await prisma.purchase
			.update({
				where: { id: params.purchaseId },
				data: {
					teacherApproval: {
						upsert: {
							update: {
								by: { connect: { id: teacher.id } },
								approved: true,
							},
							create: {
								by: { connect: { id: teacher.id } },
								approved: true,
							},
						},
					},
				},
			})
			.catch(() => errorRedirect("購入の承認に失敗しました。"))
		return successRedirect("購入を承認しました。")
	}
	return null
}
