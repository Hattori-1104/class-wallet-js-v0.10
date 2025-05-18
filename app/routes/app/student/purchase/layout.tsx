// import { Flag } from "lucide-react"
import { Outlet } from "react-router"
import {
	MainContainer,
	Section,
	SectionTitle,
} from "~/components/common/container"
import { Header, HeaderBackButton } from "~/components/common/header"
import { Distant } from "~/components/common/placement"
import { Title } from "~/components/common/typography"
import { prisma } from "~/services/repository.server"
import { entryPartRoute } from "~/services/route-module.server"
import { errorBuilder } from "~/services/session.server"
import { formatCurrency } from "~/utilities/display"
import type { Route } from "./+types/layout"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { partId, session, student } = await entryPartRoute(
		request,
		params.partId,
	)
	const errorRedirect = errorBuilder(`/app/student/part/${partId}`, session)

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
	return { purchase, partId }
}

export default ({ loaderData: { purchase, partId } }: Route.ComponentProps) => {
	return (
		<>
			<Header>
				<HeaderBackButton to={`/app/student/part/${partId}`} />
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
					</SectionTitle>
				</Section>
				<Outlet />
			</MainContainer>
		</>
	)
}
