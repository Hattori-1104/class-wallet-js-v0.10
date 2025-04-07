import { Link } from "react-router"
import { Button } from "~/components/ui/button"
import { prisma } from "~/services/repository.server"
import { verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/dashboard"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const studentId = await verifyStudent(request)
	const wallets = await prisma.wallet.findMany({
		where: {
			parts: {
				some: {
					students: {
						some: {
							id: studentId,
						},
					},
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
		<div className="container mx-auto px-8 space-y-8">
			<section>
				<h1 className="font-semibold text-lg my-8">ダッシュボード</h1>
				<div>
					{wallets.map((wallet) =>
						wallet.parts.map((part) => (
							<Button key={part.id} asChild>
								<Link to={`part/${part.id}`}>
									<span>{wallet.name}</span>:<span>{part.name}</span>
								</Link>
							</Button>
						)),
					)}
				</div>
				<div>
					{wallets.map((wallet) => (
						<Button key={wallet.id} asChild>
							<Link to={`wallet/${wallet.id}`}>{wallet.name}</Link>
						</Button>
					))}
				</div>
			</section>
		</div>
	)
}
