import { Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { partPersonInChargeSelectQuery, partWithUserWhereQuery, prisma } from "~/services/repository.server"
import { createErrorRedirect, requireSession, verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/request"

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
			include: {
				state: {
					select: {
						requests: {
							orderBy: {
								at: "asc",
							},
							select: {
								approved: true,
								at: true,
								by: {
									select: {
										id: true,
										name: true,
									},
								},
							},
						},
					},
				},
				part: { select: partPersonInChargeSelectQuery() },
			},
		})
		.catch(errorRedirect("購入情報が見つかりません").catch())
	if (purchase.state.requests.length === 0) {
		return await errorRedirect("購入情報が見つかりません").throw()
	}
	const isInCharge = purchase.part.wallet.accountantStudents.some(
		(accountantStudent: { id: string; name: string }) => accountantStudent.id === student.id,
	)
	return { purchase, isInCharge }
}

export default ({ loaderData: { purchase, isInCharge } }: Route.ComponentProps) => {
	return (
		<>
			<Section>
				<SectionTitle>
					<Title>購入申請</Title>
				</SectionTitle>
			</Section>
			{isInCharge && (
				<Section>
					<SectionTitle>
						<Title>購入申請</Title>
					</SectionTitle>
				</Section>
			)}
		</>
	)
}
