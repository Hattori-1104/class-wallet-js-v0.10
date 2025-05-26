import { Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { prisma } from "~/services/repository.server"
import { entryTeacherRoute } from "~/services/route-module.server"
import { errorBuilder } from "~/services/session.server"
import { PurchaseApprovalSectionContent } from "~/super-modules/purchase/approval"
import {
	PurchaseApprovalSelectQuery,
	processPurchaseApproval,
} from "~/super-modules/purchase/approval.server"
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
			<SectionTitle>
				<Title>購入承認</Title>
			</SectionTitle>
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

	if (action !== "approve" && action !== "reject") {
		return null
	}

	return await processPurchaseApproval({
		type: "teacher",
		purchaseId: params.purchaseId,
		teacherId: teacher.id,
		walletId,
		action,
		session,
	})
}
