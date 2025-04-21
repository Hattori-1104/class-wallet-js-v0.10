import { Form, Link } from "react-router"
import { Section, Section2Column, SectionTitle } from "~/components/common/container"
import { Note, Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { createErrorRedirect, prisma } from "~/services/repository.server"
import { getSession, verifyStudent } from "~/services/session.server"
import { getActualUsage, getPlannedUsage } from "~/utilities/calc"
import type { Route } from "./+types/index"
import { BudgetSection } from "./components/budget-section"
import { ManagerSection } from "./components/manager-section"
import { PurchaseSection } from "./components/purchase-section"

export const loader = async ({ request, params: { partId } }: Route.LoaderArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const studentId = await verifyStudent(session)
	const errorRedirect = createErrorRedirect(session, "/app/student")
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
		.catch(errorRedirect("パートが存在しません。").catch())
	const [
		{
			purchases: purchasesInProgress,
			_count: { purchases: purchaseCountInProgress },
		},
		{ purchases: purchasesAll },
	] = await Promise.all([
		prisma.part.findUniqueOrThrow({
			where: {
				id: part.id,
			},
			select: {
				_count: {
					select: {
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
										{
											NOT: {
												completedAt: null,
											},
										},
									],
								},
							},
						},
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
						reportedAt: true,
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
								{
									NOT: {
										completedAt: null,
									},
								},
							],
						},
					},
				},
			},
		}),
		prisma.part.findUniqueOrThrow({
			where: {
				id: part.id,
			},
			select: {
				purchases: {
					select: {
						reportedAt: true,
						actualUsage: true,
						items: {
							select: {
								quantity: true,
								product: {
									select: {
										price: true,
									},
								},
							},
						},
					},
				},
			},
		}),
	]).catch(errorRedirect("パートが存在しません。").catch())
	return { part, purchasesInProgress, purchasesAll, purchaseCountInProgress }
}

export default ({ loaderData: { part, purchasesInProgress, purchasesAll, purchaseCountInProgress } }: Route.ComponentProps) => {
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
					usage={getActualUsage(purchasesAll)}
					plannedUsage={getPlannedUsage(purchasesInProgress)}
					purchaseCountInProgress={purchaseCountInProgress}
				/>
				<ManagerSection leaders={part.leaders} accountantStudents={part.wallet.accountantStudents} teachers={part.wallet.teachers} />
			</Section2Column>
			<PurchaseSection purchases={purchasesInProgress} purchaseCountInProgress={purchaseCountInProgress} />
		</>
	)
}
