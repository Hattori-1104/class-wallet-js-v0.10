import {
	Section,
	SectionContent,
	SectionTitle,
} from "~/components/common/container"
import { Title } from "~/components/common/typography"
import {
	CashBookFilter,
	CashBookTabel,
	PurchaseRecordableOrderByQuery,
	PurchaseRecordableSelectQuery,
	PurchaseRecordableWhereQuery,
} from "~/route-modules/cash-book"
import { entryTeacherRoute } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import type { Route } from "./+types/cash-book"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { teacher, walletId } = await entryTeacherRoute(
		request,
		params.walletId,
		true,
	)

	// ウォレット情報とパーツ情報を同時に取得
	const wallet = await prisma.wallet.findUnique({
		where: {
			id: walletId,
		},
		select: {
			id: true,
			name: true,
			parts: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	})

	const url = new URL(request.url)
	const searchParams = new URLSearchParams(url.searchParams)
	const filter = searchParams.getAll("filter")

	// フィルターが空の場合は、すべてのパートのIDを使用
	const allPartIds = wallet?.parts.map((part) => part.id) || []
	const targetPartIds = filter.length > 0 ? filter : allPartIds

	const filteredPurchases = await prisma.purchase.findMany({
		where: {
			part: {
				id: {
					in: targetPartIds,
				},
				walletId: walletId,
			},
			...PurchaseRecordableWhereQuery,
		},
		select: PurchaseRecordableSelectQuery,
		orderBy: PurchaseRecordableOrderByQuery,
	})
	const filteredParts = await prisma.part.findMany({
		where: {
			id: {
				in: targetPartIds,
			},
			walletId: walletId,
		},
		select: {
			id: true,
			name: true,
			budget: true,
		},
	})

	return {
		parts: wallet?.parts || [],
		filter,
		filteredPurchases,
		filteredParts,
		wallet: wallet ? { id: wallet.id, name: wallet.name } : null,
	}
}

export default ({ loaderData }: Route.ComponentProps) => {
	return (
		<Section>
			<SectionTitle>
				<Title>出納簿</Title>
			</SectionTitle>
			<SectionContent>
				<CashBookFilter parts={loaderData.parts} filter={loaderData.filter} />
			</SectionContent>
			<SectionContent>
				<CashBookTabel
					purchases={loaderData.filteredPurchases}
					filteredParts={loaderData.filteredParts}
					wallet={loaderData.wallet}
				/>
			</SectionContent>
		</Section>
	)
}
