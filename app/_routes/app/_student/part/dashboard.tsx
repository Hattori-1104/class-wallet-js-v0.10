import { Link } from "react-router"
import { LightBox } from "~/components/common/box"
import {
	HorizonContainer,
	Section,
	SectionTitle,
} from "~/components/common/container"
import { Distant } from "~/components/common/placement"
import { Heading, NoData, Note, Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { BudgetGauge } from "~/components/utility/gauge"
import { NotificationDot } from "~/components/utility/notification-dot"
import {
	partWithUserWhereQuery,
	prisma,
	purchaseItemSelectQuery,
	purchaseStateSelectQuery,
} from "~/services/repository.server"
import { verifyStudent } from "~/services/route-module.server"
import { requireSession } from "~/services/session.server"
import { formatDiffDate, formatMoney } from "~/utilities/display"
import type { Route } from "./+types/dashboard"

export const loader = async ({
	request,
	params: { partId },
}: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	const [part, purchases] = await Promise.all([
		prisma.part.findUniqueOrThrow({
			where: {
				...partWithUserWhereQuery(partId, student.id),
			},
			include: {
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
					},
				},
			},
		}),
		prisma.purchase.findMany({
			where: {
				part: partWithUserWhereQuery(partId, student.id),
			},
			include: {
				items: {
					select: purchaseItemSelectQuery(),
				},
				state: {
					select: {
						updatedAt: true,
						...purchaseStateSelectQuery(),
					},
				},
			},
			orderBy: {
				state: {
					updatedAt: "desc",
				},
			},
		}),
	])

	return { part, purchases }
}

export default ({ loaderData: { part, purchases } }: Route.ComponentProps) => {
	const actualUsage = purchases.reduce((acc, purchase) => {
		if (
			purchase.state.request?.approved &&
			purchase.state.usageReport &&
			purchase.state.changeReturn &&
			purchase.state.receiptSubmission
		) {
			return acc + purchase.state.usageReport.actualUsage
		}
		return acc
	}, 0)
	const plannedUsage = purchases.reduce((acc, purchase) => {
		if (
			purchase.state.request?.approved &&
			!(purchase.state.changeReturn && purchase.state.receiptSubmission)
		) {
			return acc + purchase.plannedUsage
		}
		return acc
	}, 0)
	return (
		<>
			<Section>
				<SectionTitle className="flex flex-row items-center justify-between">
					<div>
						<Title>{part.name}</Title>
						<Note>{part.wallet.name}</Note>
					</div>
					<Button asChild>
						<Link to={`/app/student/part/${part.id}/purchase/new`}>
							購入をリクエスト
						</Link>
					</Button>
				</SectionTitle>
			</Section>
			<HorizonContainer>
				<Section>
					<SectionTitle>
						<Title>予算状況</Title>
					</SectionTitle>
					<div className="w-full space-y-2">
						<Distant>
							<span>残り予算</span>
							<span>{formatMoney(part.budget - actualUsage)}</span>
						</Distant>
						<BudgetGauge
							budget={part.budget}
							actualUsage={actualUsage}
							plannedUsage={plannedUsage}
						/>
						<Distant>
							<span>使用予定</span>
							<span>{formatMoney(plannedUsage)}</span>
						</Distant>
					</div>
				</Section>
				{/* <Section>
					<SectionTitle>
						<Title>責任者</Title>
					</SectionTitle>
					<div className="space-y-2">
						{part.wallet.teachers.map((teacher) => (
							<UserItem key={teacher.id} name={teacher.name}>
								<TeacherBadge />
							</UserItem>
						))}
						{part.wallet.accountantStudents.map((accountant) => (
							<UserItem key={accountant.id} name={accountant.name}>
								<AccountantBadge />
								{part.leaders.some((leader) => leader.id === accountant.id) && <LeaderBadge />}
							</UserItem>
						))}
						{part.leaders
							.filter((leader) => !part.wallet.accountantStudents.some((accountant) => leader.id === accountant.id))
							.map((leader, index) => (
								<UserItem key={leader.id + index} name={leader.name}>
									<LeaderBadge />
								</UserItem>
							))}
					</div>
				</Section> */}
			</HorizonContainer>
			<Section>
				<SectionTitle>
					<Distant>
						<Title>進行中の購入</Title>
						<NotificationDot count={purchases.length} />
					</Distant>
				</SectionTitle>
				<div className="space-y-4">
					{purchases.length > 0 ? (
						purchases.map((purchase, index) => (
							<Link
								key={purchase.id + index}
								to={`/app/student/part/${part.id}/purchase/${purchase.id}`}
								className="block"
							>
								<LightBox className="space-y-2">
									<Distant>
										<Heading className="shrink text-wrap">
											{purchase.label}
										</Heading>
										<Note className="shrink-0">
											{formatDiffDate(purchase.state.updatedAt, Date.now())}
										</Note>
									</Distant>
									<div>
										<Distant>
											<span>
												<span>
													{purchase.state.request?.by.name}がリクエスト
												</span>
												{purchase.state.request?.approved === false && (
													<span className="text-destructive">
														→取り消されました。
													</span>
												)}
												{(purchase.state.accountantApproval?.approved ===
													false ||
													purchase.state.teacherApproval?.approved ===
														false) && (
													<span className="text-destructive">
														→承認されませんでした。
													</span>
												)}
											</span>
											<span className="shrink-0 italic">
												{formatMoney(purchase.plannedUsage)}
											</span>
										</Distant>
										{purchase.state.usageReport && (
											<Distant>
												<span>購入完了</span>
												<span className="shrink-0 italic">
													{formatMoney(purchase.state.usageReport.actualUsage)}
												</span>
											</Distant>
										)}
										{purchase.state.receiptSubmission && (
											<Distant>
												<span>レシート提出完了</span>
												<span className="shrink-0">
													レシート番号：
													{purchase.state.receiptSubmission.receiptIndex}
												</span>
											</Distant>
										)}
									</div>
								</LightBox>
							</Link>
						))
					) : (
						<NoData>進行中の購入はありません</NoData>
					)}
				</div>
			</Section>
		</>
	)
}
