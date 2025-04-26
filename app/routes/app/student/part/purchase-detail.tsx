import { Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { partWithUserWhereQuery, prisma } from "~/services/repository.server"
import { createErrorRedirect, requireSession, verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/purchase-detail"

export const loader = async ({ params: { partId, purchaseId }, request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)

	const errorRedirect = await createErrorRedirect(session, `/app/student/part/${partId}`)
	const purchase = await prisma.purchase
		.findUniqueOrThrow({
			where: {
				id: purchaseId,
				part: {
					...partWithUserWhereQuery(partId, student.id),
				},
			},
		})
		.catch(errorRedirect("購入情報が見つかりません").catch())

	return { purchase }
}

export default ({ loaderData: { purchase } }: Route.ComponentProps) => {
	return (
		<Section>
			<SectionTitle>
				<Title>{purchase.label}</Title>
			</SectionTitle>
		</Section>
	)
}
