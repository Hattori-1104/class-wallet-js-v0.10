import { Link } from "react-router"
import { MainContainer, Section, Section2Column, SectionTitle } from "~/components/common/container"
import { Button } from "~/components/ui/button"
import { prisma } from "~/services/repository.server"
import { getSession, verifyTeacher } from "~/services/session.server"
import type { Route } from "./+types/dashboard"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const teacherId = await verifyTeacher(session)
	const wallets = await prisma.wallet.findMany({
		where: {
			teachers: {
				some: {
					id: teacherId,
				},
			},
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
	return { wallets }
}

export default ({ loaderData: { wallets } }: Route.ComponentProps) => {
	return (
		<MainContainer>
			<Section>
				<SectionTitle>担当ウォレット</SectionTitle>
				<div>
					{wallets.map((wallet) => (
						<Button key={wallet.id} asChild>
							<Link to={`/app/teacher/wallet/${wallet.id}`}>{wallet.name}</Link>
						</Button>
					))}
				</div>
			</Section>
		</MainContainer>
	)
}
