import { Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { entryStudentRoute } from "~/route-modules/common.server"
import { PurchaseApprovalSectionContent } from "~/route-modules/purchase-state/approval"
import { PurchaseApprovalSelectQuery, processPurchaseApproval } from "~/route-modules/purchase-state/approval.server"
import { queryIsStudentInCharge } from "~/route-modules/purchase-state/common.server"
import { prisma } from "~/services/repository.server"
import { buildErrorRedirect } from "~/services/session.server"
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

	return await processPurchaseApproval({
		type: "student",
		purchaseId: params.purchaseId,
		studentId: student.id,
		partId,
		action,
		session,
	})
}
