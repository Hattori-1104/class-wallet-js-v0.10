import { Link } from "react-router"
import { MainContainer, Section, Section2Column, SectionTitle } from "~/components/common/container"
import { Button } from "~/components/ui/button"
import { prisma } from "~/services/repository.server"
import { getSession, verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/dashboard"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const studentId = await verifyStudent(session)
	const wallets = await prisma.wallet.findMany({
		where: {
			OR: [
				{
					parts: {
						some: {
							students: { some: { id: studentId } },
						},
					},
				},
				{
					accountantStudents: {
						some: {
							id: studentId,
						},
					},
				},
			],
		},
		select: {
			id: true,
			name: true,
			parts: {
				select: {
					id: true,
					name: true,
				},
				where: {
					students: {
						some: {
							id: studentId,
						},
					},
				},
			},
		},
	})
	return { wallets }
}

export default ({ loaderData: { wallets } }: Route.ComponentProps) => {
	return (
		<MainContainer>
			<Section2Column>
				<Section>
					<SectionTitle>所属パート</SectionTitle>
					<div>
						{wallets.map((wallet) =>
							wallet.parts.map((part) => (
								<Button key={part.id} asChild>
									<Link to={`/app/student/part/${part.id}`}>
										<span>{wallet.name}</span>:<span>{part.name}</span>
									</Link>
								</Button>
							)),
						)}
					</div>
				</Section>
				<Section>
					<SectionTitle>所属ウォレット</SectionTitle>
					<div>
						{wallets.map((wallet) => (
							<Button key={wallet.id} asChild>
								<Link to={`wallet/${wallet.id}`}>{wallet.name}</Link>
							</Button>
						))}
					</div>
				</Section>
			</Section2Column>
		</MainContainer>
	)
}
