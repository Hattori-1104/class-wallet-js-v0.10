import { Section, SectionContent, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { partWithUserWhereQuery, prisma } from "~/services/repository.server"
import { createErrorRedirect, requireSession, verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/purchase-detail"

const queryIsLeader = async (partId: string, studentId: string) =>
	Boolean(
		await prisma.part.findUnique({
			where: {
				...partWithUserWhereQuery(partId, studentId),
				leaders: {
					some: {
						id: studentId,
					},
				},
			},
		}),
	)

const queryIsAccountant = async (partId: string, studentId: string) =>
	Boolean(
		await prisma.part.findUnique({
			where: {
				...partWithUserWhereQuery(partId, studentId),
				wallet: {
					accountantStudents: {
						some: {
							id: studentId,
						},
					},
				},
			},
		}),
	)

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
			select: {
				id: true,
				label: true,
				createdAt: true,
				updatedAt: true,
				plannedUsage: true,
				items: {
					select: {
						id: true,
						quantity: true,
						product: {
							select: {
								id: true,
								name: true,
								price: true,
							},
						},
					},
				},
				state: {
					select: {
						request: {
							select: {
								approved: true,
								by: {
									select: {
										name: true,
									},
								},
								at: true,
							},
						},
						accountantApproval: {
							select: {
								approved: true,
								by: {
									select: {
										name: true,
									},
								},
								at: true,
							},
						},
						teacherApproval: {
							select: {
								approved: true,
								by: {
									select: {
										name: true,
									},
								},
								at: true,
							},
						},
						usageReport: {
							select: {
								actualUsage: true,
								at: true,
							},
						},
						receiptSubmission: {
							select: {
								receiptIndex: true,
								at: true,
							},
						},
						fishingReturned: {
							select: {
								at: true,
							},
						},
					},
				},
			},
		})
		.catch(errorRedirect("購入情報が見つかりません").catch())
	const isLeader = await queryIsLeader(partId, student.id)
	const isAccountant = await queryIsAccountant(partId, student.id)
	return { purchase, isLeader, isAccountant }
}

export default ({ loaderData: { purchase, isLeader, isAccountant } }: Route.ComponentProps) => {
	return (
		<Section>
			<SectionTitle>
				<Title>{purchase.label}</Title>
			</SectionTitle>
			<SectionContent>
				{isLeader && <Button>リーダーの承認を要求する</Button>}
				{isAccountant && <Button>会計の承認を要求する</Button>}
			</SectionContent>
		</Section>
	)
}
