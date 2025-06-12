import {
	Section,
	SectionContent,
	SectionTitle,
} from "~/components/common/container"
import {
	CashBookTable,
	PurchaseRecordableSelectQuery,
	PurchaseRecordableWhereQuery,
} from "~/route-modules/cash-book"
import { entryAdminRoute } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import type { Route } from "./+types/cash-book"

export const loader = async ({ request }: Route.LoaderArgs) => {
	await entryAdminRoute(request)

	const wallets = await prisma.wallet.findMany({
		select: {
			id: true,
			name: true,
			budget: true,
			parts: {
				select: {
					purchases: {
						where: PurchaseRecordableWhereQuery,
						select: PurchaseRecordableSelectQuery,
					},
					id: true,
					name: true,
					budget: true,
				},
			},
		},
	})
	return { wallets }
}

export default ({ loaderData: { wallets } }: Route.ComponentProps) => {
	return (
		<>
			{wallets.map((wallet) => (
				<Section key={wallet.id}>
					<SectionTitle>{wallet.name}</SectionTitle>
					<SectionContent>
						<CashBookTable
							purchases={wallet.parts.flatMap((part) => part.purchases)}
							filteredParts={wallet.parts}
							wallet={wallet}
							reserved={
								wallet.budget -
								wallet.parts.reduce((sum, part) => sum + part.budget, 0)
							}
						/>
					</SectionContent>
				</Section>
			))}
		</>
	)
}
