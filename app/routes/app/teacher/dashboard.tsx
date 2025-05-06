import { Link } from "react-router"
import { LightBox } from "~/components/common/box"
import { HorizonContainer, Section, SectionTitle } from "~/components/common/container"
import { Heading, NoData, Title } from "~/components/common/typography"
import { prisma } from "~/services/repository.server"
import { createErrorRedirect, requireSession, verifyTeacher } from "~/services/session.server"
import type { Route } from "./+types/dashboard"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const teacher = await verifyTeacher(session)

	const errorRedirect = createErrorRedirect(session, "/auth")

	const belongingWalletsPromise = prisma.wallet
		.findMany({
			where: { teachers: { some: { id: teacher.id } } },
			select: {
				id: true,
				name: true,
			},
		})
		.catch(errorRedirect("ウォレットの取得に失敗しました。").catch())

	const [belongingWallets] = await Promise.all([belongingWalletsPromise])

	return { belongingWallets }
}

export default ({ loaderData: { belongingWallets } }: Route.ComponentProps) => {
	return (
		<>
			<HorizonContainer>
				<Section>
					<SectionTitle>
						<Title>担当しているパート</Title>
					</SectionTitle>
					<div className="space-y-4">
						{belongingWallets.length > 0 ? (
							belongingWallets.map((wallet, index) => (
								<Link key={index} to={`/app/teacher/wallet/${wallet.id}`} className="block">
									<LightBox>
										<Heading>{wallet.name}</Heading>
									</LightBox>
								</Link>
							))
						) : (
							<NoData>ウォレットを担当していません。</NoData>
						)}
					</div>
				</Section>
			</HorizonContainer>
		</>
	)
}
