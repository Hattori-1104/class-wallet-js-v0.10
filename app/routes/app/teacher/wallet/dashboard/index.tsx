import { useMemo } from "react"
import { HorizonContainer, Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { prisma } from "~/services/repository.server"
import { createErrorRedirect } from "~/services/session.server"
import { getSession, verifyTeacher } from "~/services/session.server"
import { getWalletActualUsage, getWalletPlannedUsage } from "~/utilities/calc"
import type { Route } from "./+types/index"
import { BudgetSection } from "./components/budget-section"
import { ManagerSection } from "./components/manager-section"
import { PurchaseSection } from "./components/purchase-section"

export const loader = async ({ request, params: { walletId } }: Route.LoaderArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const teacherId = await verifyTeacher(session)
	const errorRedirect = createErrorRedirect(session, "/app/teacher")
	const wallet = await prisma.wallet
		.findUniqueOrThrow({
			where: {
				id: walletId,
				teachers: {
					some: {
						id: teacherId,
					},
				},
			},
			select: {
				id: true,
				name: true,
				accountantStudents: {
					select: {
						id: true,
						name: true,
					},
				},
				teachers: {
					select: {
						id: true,
						name: true,
					},
				},
				budget: true,
				parts: {
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
				},
			},
		})
		.catch(errorRedirect("ウォレットが存在しません。").catch())
	return { wallet }
}

export default ({ loaderData: { wallet } }: Route.ComponentProps) => {
	const actualUsage = useMemo(() => getWalletActualUsage(wallet), [wallet])
	const plannedUsage = useMemo(() => getWalletPlannedUsage(wallet), [wallet])
	const purchaseInProgress = wallet.parts.reduce((acc, part) => acc + part._count.purchases, 0)
	const leaders = wallet.parts.flatMap((part) => part.leaders.map((leader) => ({ ...leader, part })))
	return (
		<>
			<Section>
				<SectionTitle>
					<Title>{wallet.name}</Title>
				</SectionTitle>
			</Section>
			<HorizonContainer>
				<ManagerSection leaders={leaders} accountantStudents={wallet.accountantStudents} teachers={wallet.teachers} />
				<BudgetSection budget={wallet.budget} usage={actualUsage} plannedUsage={plannedUsage} purchaseInProgress={purchaseInProgress} />
			</HorizonContainer>
			<PurchaseSection wallet={wallet} />
		</>
	)
}
