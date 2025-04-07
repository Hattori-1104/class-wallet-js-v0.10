import { Link } from "react-router"
import { Section, SectionTitle } from "~/components/common/container"
import { Button } from "~/components/ui/button"
import { errorRedirect, prisma } from "~/services/repository.server"
import { verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/index"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const studentId = await verifyStudent(request)
	const part = await prisma.part
		.findUniqueOrThrow({
			where: {
				id: params.partId,
				students: {
					some: {
						id: studentId,
					},
				},
			},
			select: {
				id: true,
				name: true,
				budget: true,
				students: {
					select: {
						id: true,
						name: true,
					},
				},
				leaders: {
					select: {
						id: true,
						name: true,
					},
				},
				wallet: {
					select: {
						id: true,
						name: true,
						budget: true,
					},
				},
			},
		})
		.catch(errorRedirect(request, "/app/student", "パートが存在しません。"))
	return { part }
}

export default ({ loaderData: { part } }: Route.ComponentProps) => {
	return (
		<Section>
			<SectionTitle className="flex flex-row items-center justify-between">
				<div>
					<h1 className="font-semibold text-lg">{part.name}</h1>
					<p className="text-muted-foreground leading-none">{part.wallet.name}</p>
				</div>
				<Button asChild>
					<Link to="purchase/new">購入をリクエスト</Link>
				</Button>
			</SectionTitle>
		</Section>
	)
}
