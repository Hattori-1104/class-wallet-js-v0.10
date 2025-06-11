import { Outlet } from "react-router"
import { Section, SectionTitle } from "~/components/common/container"
import { MainContainer } from "~/components/common/container"
import { HeaderBackButton } from "~/components/common/header"
import { Header } from "~/components/common/header"
import { Distant } from "~/components/common/placement"
import { Title } from "~/components/common/typography"
import { entryTeacherRoute } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import { errorBuilder } from "~/services/session.server"
import { formatCurrency } from "~/utilities/display"
import type { Route } from "./+types/layout"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { walletId, session, teacher } = await entryTeacherRoute(
		request,
		params.walletId,
	)
	const errorRedirect = errorBuilder(`/app/teacher/wallet/${walletId}`, session)
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
			select: {
				id: true,
				label: true,
				canceled: true,
				plannedUsage: true,
				completion: {
					select: {
						actualUsage: true,
					},
				},
				requestedBy: {
					select: {
						name: true,
					},
				},
			},
		})
		.catch(() => errorRedirect("購入データが見つかりません。"))
	return { purchase, walletId }
}

export default ({
	loaderData: { purchase, walletId },
}: Route.ComponentProps) => {
	return (
		<>
			<Header>
				<HeaderBackButton to={`/app/teacher/wallet/${walletId}`} />
			</Header>
			<MainContainer>
				<Section>
					<SectionTitle>
						<Distant>
							<Title>{purchase.label}</Title>
							{purchase.completion ? (
								<>
									<span className="text-lg">
										{formatCurrency(purchase.completion.actualUsage)}
									</span>
								</>
							) : (
								<span>
									<span>（予定額）</span>
									<span className="text-lg">
										{formatCurrency(purchase.plannedUsage)}
									</span>
								</span>
							)}
						</Distant>
						<span className="text-muted-foreground">
							{purchase.requestedBy.name} さんがリクエスト
						</span>
					</SectionTitle>
				</Section>
				<Outlet />
			</MainContainer>
		</>
	)
}
