import { Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { entryStudentRoute } from "~/route-modules/common.server"
import { queryIsInCharge } from "~/route-modules/purchase-state/common.server"
import { PurchaseReceiptSubmissionSectionContent } from "~/route-modules/purchase-state/receipt-submission"
import { PurchaseReceiptSubmissionSelectQuery } from "~/route-modules/purchase-state/receipt-submission.server"
import { prisma } from "~/services/repository.server"
import { buildErrorRedirect, buildSuccessRedirect } from "~/services/session.server"
import type { Route } from "./+types/receipt-submission"

const queryIsRequester = async (purchaseId: string, studentId: string) => {
	const purchase = await prisma.purchase.findUnique({
		where: {
			id: purchaseId,
			requestedBy: { id: studentId },
			part: { students: { some: { id: studentId } } },
		},
	})
	return Boolean(purchase)
}

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { partId, student, session } = await entryStudentRoute(request, params.partId)
	const isAccountant = await queryIsInCharge({
		type: "accountant",
		id: { use: "part", part: partId },
		studentId: student.id,
	})
	const isRequester = await queryIsRequester(params.purchaseId, student.id)
	const errorRedirect = buildErrorRedirect(`/app/student/part/${partId}/purchase/${params.purchaseId}`, session)
	const purchase = await prisma.purchase
		.findUniqueOrThrow({
			where: {
				id: params.purchaseId,
				part: { id: partId, students: { some: { id: student.id } } },
			},
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
	const { partId, student, session } = await entryStudentRoute(request, params.partId)
	const errorRedirect = buildErrorRedirect(`/app/student/part/${partId}/purchase/${params.purchaseId}`, session)
	const formData = await request.formData()
	const accepted = formData.get("receiptSubmission") === "accepted"
	if (!accepted) {
		return errorRedirect("レシートが見つかりません")
	}

	const isAccountant = await queryIsInCharge({
		type: "accountant",
		id: { use: "part", part: partId },
		studentId: student.id,
	})
	if (!isAccountant) {
		return errorRedirect("権限がありません")
	}

	const receiptIndex =
		(await prisma.purchase.count({
			where: {
				receiptSubmission: { isNot: null },
				id: { not: params.purchaseId },
				part: { wallet: { parts: { some: { id: partId } } } },
			},
		})) + 1

	const purchase = await prisma.purchase
		.update({
			where: { id: params.purchaseId },
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
				receiptSubmission: {
					select: {
						receiptIndex: true,
					},
				},
			},
		})
		.catch(() => errorRedirect("レシート提出に失敗しました。"))
	const successRedirect = buildSuccessRedirect(`/app/student/part/${partId}/purchase/${params.purchaseId}`, session)
	return successRedirect(`レシートを提出しました。番号：${purchase.receiptSubmission?.receiptIndex}`)
}
