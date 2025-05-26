import { Link } from "react-router"
import {
	Section,
	SectionContent,
	SectionTitle,
} from "~/components/common/container"
import { Distant } from "~/components/common/placement"
import { NoData, Title } from "~/components/common/typography"
import { AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Alert } from "~/components/ui/alert"
import { prisma } from "~/services/repository.server"
import { entryTeacherRoute } from "~/services/route-module.server"
import { formatCurrency, formatDiffDate } from "~/utilities/display"
import type { Route } from "./+types/wallet"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { teacher, walletId } = await entryTeacherRoute(
		request,
		params.walletId,
		false,
	)

	if (!walletId) return null

	const wallet = await prisma.wallet.findUniqueOrThrow({
		where: { id: walletId },
		select: {
			id: true,
			name: true,
			budget: true,
			parts: {
				select: {
					id: true,
					name: true,
					purchases: {
						select: {
							id: true,
							label: true,
							description: true,
							plannedUsage: true,
							updatedAt: true,
						},
						orderBy: {
							updatedAt: "desc",
						},
					},
				},
			},
		},
	})

	return { wallet, walletId }
}

export default ({ loaderData }: Route.ComponentProps) => {
	if (!loaderData)
		return (
			<>
				<Section>
					<NoData>ウォレットに所属していません。</NoData>
				</Section>
			</>
		)
	const { wallet, walletId } = loaderData
	return (
		<>
			<Section>
				<SectionTitle>
					<Title>{wallet.name}</Title>
				</SectionTitle>
			</Section>
			<Section>
				<SectionTitle>
					<Title>買い出し</Title>
				</SectionTitle>
				<SectionContent className="flex flex-col gap-2">
					{wallet.parts.map((part) =>
						part.purchases.map((purchase) => (
							<Link
								key={purchase.id}
								to={`/app/teacher/wallet/${walletId}/purchase/${purchase.id}`}
							>
								<Alert>
									<AlertTitle>
										<Distant>
											<span className="font-bold">{purchase.label}</span>
											<span className="font-normal">
												{formatCurrency(purchase.plannedUsage)}
											</span>
										</Distant>
									</AlertTitle>
									<AlertDescription>
										<span>{purchase.description}</span>
										<span>{formatDiffDate(purchase.updatedAt)}</span>
									</AlertDescription>
								</Alert>
							</Link>
						)),
					)}
				</SectionContent>
			</Section>
		</>
	)
}
