import { SectionTitle } from "~/components/common/container"
import { Section } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { entryTeacherRoute } from "~/route-modules/common.server"
import { PurchaseReceiptSubmissionSectionContent } from "~/route-modules/purchase-state/receipt-submission"
import { PurchaseReceiptSubmissionSelectQuery } from "~/route-modules/purchase-state/receipt-submission.server"
import { prisma } from "~/services/repository.server"
import { buildErrorRedirect } from "~/services/session.server"
import type { Route } from "./+types/receipt-submission"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { walletId, teacher, session } = await entryTeacherRoute(
		request,
		params.walletId,
	)
	const errorRedirect = buildErrorRedirect(
		`/app/teacher/wallet/${params.walletId}/purchase/${params.purchaseId}`,
		session,
	)
	const purchase = await prisma.purchase
		.findUniqueOrThrow({
			where: {
				id: params.purchaseId,
				part: {
					wallet: {
						id: walletId,
					},
				},
			},
			select: PurchaseReceiptSubmissionSelectQuery,
		})
		.catch(() => errorRedirect("購入が見つかりません"))
	return { purchase }
}

export default ({ loaderData }: Route.ComponentProps) => {
	const { purchase } = loaderData
	return (
		<Section>
			<SectionTitle>
				<Title>レシート提出</Title>
			</SectionTitle>
			<PurchaseReceiptSubmissionSectionContent
				purchase={purchase}
				isAccountant={false}
				isRequester={false}
			/>
		</Section>
	)
}
