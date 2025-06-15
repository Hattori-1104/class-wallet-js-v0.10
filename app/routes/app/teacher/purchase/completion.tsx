import { Section, SectionContent, SectionTitle } from "~/components/common/container"
import { entryTeacherRoute } from "~/route-modules/common.server"
import { PurchaseCompletionSectionContent } from "~/route-modules/purchase-state/completion"
import { PurchaseCompletionSelectQuery } from "~/route-modules/purchase-state/completion.server"
import { prisma } from "~/services/repository.server"
import type { Route } from "./+types/completion"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { walletId, teacher } = await entryTeacherRoute(request, params.walletId)

	// TODO: エラーハンドリング
	const purchase = await prisma.purchase.findUniqueOrThrow({
		where: {
			id: params.purchaseId,
			part: {
				wallet: { id: walletId, teachers: { some: { id: teacher.id } } },
			},
		},
		select: PurchaseCompletionSelectQuery,
	})
	return { purchase }
}

export default ({ loaderData }: Route.ComponentProps) => {
	return (
		<>
			<Section>
				<SectionTitle>買い出し</SectionTitle>
				<SectionContent>
					<PurchaseCompletionSectionContent purchase={loaderData.purchase} userType="teacher" isRequester={false} />
				</SectionContent>
			</Section>
		</>
	)
}
