import { Section, SectionTitle } from "~/components/common/container"
import { prisma } from "~/services/repository.server"
import { verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/summary"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const studentId = await verifyStudent(request)
	const part = await prisma.part.findFirstOrThrow({
		where: {
			students: {
				some: {
					id: studentId,
				},
			},
		},
		select: {
			id: true,
			name: true,
			purchases: {
				select: {
					id: true,
					items: {
						select: {
							id: true,
							quantity: true,
							product: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
				},
			},
		},
	})
	return { part }
}

export default ({ loaderData: { part } }: Route.ComponentProps) => {
	return (
		<Section>
			<SectionTitle className="font-semibold text-lg">購入履歴</SectionTitle>
			<div className="space-y-4">
				{part.purchases.map((purchase) => (
					<div key={purchase.id}>{purchase.id}</div>
				))}
			</div>
		</Section>
	)
}
