import { Section, SectionContent, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import {
	CashBookTable,
	PurchaseRecordableOrderByQuery,
	PurchaseRecordableSelectQuery,
	PurchaseRecordableWhereQuery,
} from "~/route-modules/cash-book"
import { entryTeacherRoute } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import { buildErrorRedirect } from "~/services/session.server"
import type { Route } from "./+types/cash-book"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { walletId, session } = await entryTeacherRoute(request, params.walletId, true)

	const errorRedirect = buildErrorRedirect(`/app/teacher/wallet/${walletId}`, session)

	// ウォレット情報とパーツ情報を同時に取得
	const wallet = await prisma.wallet
		.findUniqueOrThrow({
			where: {
				id: walletId,
			},
			select: {
				id: true,
				name: true,
				budget: true,
				parts: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		})
		.catch(() => errorRedirect("ウォレットが見つかりません。"))

	const purchases = await prisma.purchase.findMany({
		where: {
			part: {
				walletId: walletId,
			},
			...PurchaseRecordableWhereQuery,
		},
		select: PurchaseRecordableSelectQuery,
		orderBy: PurchaseRecordableOrderByQuery,
	})
	return { wallet, purchases }
}

export default ({ loaderData: { wallet, purchases } }: Route.ComponentProps) => {
	return (
		<Section>
			<SectionTitle>
				<Title>出納簿</Title>
			</SectionTitle>
			<SectionContent>
				<div className="border rounded-md overflow-auto max-h-[70vh]">
					<CashBookTable filteredPurchases={purchases} budget={wallet.budget} />
				</div>
			</SectionContent>
		</Section>
	)
}
