import { Link } from "react-router"
import { Section, Section2Column, SectionTitle } from "~/components/common/container"
import { Note, Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { errorRedirect, prisma } from "~/services/repository.server"
import { getSession, verifyStudent } from "~/services/session.server"
import { getPartActualUsage, getPartPlannedUsage } from "~/utilities/calc"
import type { Route } from "./+types/index"
import { BudgetSection } from "./components/budget-section"
import { ManagerSection } from "./components/manager-section"
import { PurchaseSection } from "./components/purchase-section"

export const loader = async ({ request, params: { partId } }: Route.LoaderArgs) => {
	const studentId = await verifyStudent(request)
	const part = await prisma.part
		.findUniqueOrThrow({
			where: {
				id: partId,
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
				leaders: {
					select: {
						id: true,
						name: true,
					},
				},
				purchases: {
					take: 10,
					orderBy: {
						updatedAt: "desc",
					},
					select: {
						id: true,
						label: true,
						actualUsage: true,
						items: {
							select: {
								id: true,
								product: {
									select: {
										id: true,
										name: true,
										price: true,
									},
								},
								quantity: true,
							},
						},
						requestCert: {
							select: {
								id: true,
								signedBy: {
									select: {
										id: true,
										name: true,
									},
								},
								createdAt: true,
								approved: true,
							},
						},
						accountantCert: {
							select: {
								id: true,
								signedBy: {
									select: {
										id: true,
										name: true,
									},
								},
								createdAt: true,
								approved: true,
							},
						},
						teacherCert: {
							select: {
								id: true,
								signedBy: {
									select: {
										id: true,
										name: true,
									},
								},
								createdAt: true,
								approved: true,
							},
						},
						returnedAt: true,
						completedAt: true,
					},
					where: {
						NOT: {
							OR: [
								{
									requestCert: {
										approved: false,
									},
								},
								{
									teacherCert: {
										approved: false,
									},
								},
								{
									accountantCert: {
										approved: false,
									},
								},
							],
						},
					},
				},
				wallet: {
					select: {
						id: true,
						name: true,
						accountantStudents: {
							select: {
								id: true,
								name: true,
							},
							where: {
								parts: {
									some: {
										id: partId,
									},
								},
							},
						},
						teachers: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
				_count: {
					select: {
						students: true,
						purchases: {
							where: {
								NOT: {
									OR: [
										{
											requestCert: {
												approved: false,
											},
										},
										{
											teacherCert: {
												approved: false,
											},
										},
										{
											accountantCert: {
												approved: false,
											},
										},
									],
								},
							},
						},
					},
				},
			},
		})
		.catch(errorRedirect(await getSession(request.headers.get("Cookie")), "/app/student", "パートが存在しません。"))
	return { part }
}

export default ({ loaderData: { part } }: Route.ComponentProps) => {
	return (
		<>
			<Section>
				<SectionTitle className="flex flex-row items-center justify-between">
					<div>
						<Title>{part.name}</Title>
						<Note>{part.wallet.name}</Note>
					</div>
					<Button asChild>
						<Link to="purchase/new">購入をリクエスト</Link>
					</Button>
				</SectionTitle>
			</Section>
			<Section2Column>
				<BudgetSection
					budget={part.budget}
					usage={getPartActualUsage(part)}
					plannedUsage={getPartPlannedUsage(part)}
					purchaseInProgress={part._count.purchases}
				/>
				<ManagerSection
					leaders={part.leaders}
					accountantStudents={part.wallet.accountantStudents}
					teachers={part.wallet.teachers}
				/>
			</Section2Column>
			<PurchaseSection part={part} />
		</>
	)
}
