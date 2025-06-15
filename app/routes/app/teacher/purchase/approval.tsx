import { Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { entryTeacherRoute } from "~/route-modules/common.server"
import { PurchaseApprovalSectionContent } from "~/route-modules/purchase-state/approval"
import { PurchaseApprovalSelectQuery, processPurchaseApproval } from "~/route-modules/purchase-state/approval.server"
import { prisma } from "~/services/repository.server"
import { buildErrorRedirect } from "~/services/session.server"
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

	return await processPurchaseApproval({
		type: "teacher",
		purchaseId: params.purchaseId,
		teacherId: teacher.id,
		walletId,
		action,
		session,
	})
}
