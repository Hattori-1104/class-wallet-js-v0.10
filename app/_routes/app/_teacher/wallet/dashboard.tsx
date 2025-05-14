import { Link } from "react-router"
import { LightBox } from "~/components/common/box"
import {
	HorizonContainer,
	Section,
	SectionTitle,
} from "~/components/common/container"
import { Distant } from "~/components/common/placement"
import { Heading, NoData, Note, Title } from "~/components/common/typography"
import { BudgetGauge } from "~/components/utility/gauge"
import {
	AccountantBadge,
	LeaderBadge,
	TeacherBadge,
} from "~/components/utility/manager-badge"
import { NotificationDot } from "~/components/utility/notification-dot"
import { UserItem } from "~/components/utility/user"
import {
	prisma,
	purchaseItemSelectQuery,
	purchaseStateSelectQuery,
	walletWithTeacherWhereQuery,
} from "~/services/repository.server"
import { requireSession, verifyTeacher } from "~/services/session.server"
import { formatCurrency, formatDiffDate } from "~/utilities/display"
import type { Route } from "./+types/dashboard"

export const loader = async ({
	request,
	params: { walletId },
}: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const teacher = await verifyTeacher(session)

	const wallet = await prisma.wallet.findUniqueOrThrow({
		where: walletWithTeacherWhereQuery(walletId, teacher.id),
		include: {
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
			parts: {
				include: {
					leaders: {
						select: {
							id: true,
							name: true,
						},
					},
					purchases: {
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
					},
				},
			},
		},
	})

	return { wallet }
}

export default ({ loaderData: { wallet } }: Route.ComponentProps) => {
	const purchases = wallet.parts.flatMap((part) => part.purchases)
	return (
		<>
			<Section>
				<SectionTitle>
					<Title>{wallet.name}</Title>
				</SectionTitle>
			</Section>
			<HorizonContainer>
				<Section>
					<SectionTitle>
						<Title>予算状況</Title>
					</SectionTitle>
					<div className="space-y-2">
						{wallet.parts.map((part) => {
							const actualUsage = part.purchases.reduce((acc, purchase) => {
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
							const plannedUsage = part.purchases.reduce((acc, purchase) => {
								if (
									purchase.state.request?.approved &&
									!(
										purchase.state.changeReturn &&
										purchase.state.receiptSubmission
									)
								) {
									return acc + purchase.plannedUsage
								}
								return acc
							}, 0)
							return (
								<div key={part.id} className="w-full space-y-1">
									<Distant>
										<span>{part.name}</span>
										<span>{formatCurrency(part.budget - actualUsage)}</span>
									</Distant>
									<BudgetGauge
										budget={part.budget}
										actualUsage={actualUsage}
										plannedUsage={plannedUsage}
									/>
								</div>
							)
						})}
					</div>
				</Section>
				<Section>
					<SectionTitle>
						<Title>責任者</Title>
					</SectionTitle>
					<div className="space-y-2">
						{wallet.teachers.map((teacher) => (
							<UserItem key={teacher.id} name={teacher.name}>
								<TeacherBadge />
							</UserItem>
						))}
						{wallet.accountantStudents.map((accountant) => (
							<UserItem key={accountant.id} name={accountant.name}>
								<AccountantBadge />
							</UserItem>
						))}
						{wallet.parts.map((part) =>
							part.leaders.map((leader) => (
								<UserItem key={leader.id} name={leader.name}>
									<LeaderBadge partName={part.name} />
								</UserItem>
							)),
						)}
					</div>
				</Section>
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
								to={`/app/teacher/wallet/${wallet.id}/purchase/${purchase.id}`}
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
												{formatCurrency(purchase.plannedUsage)}
											</span>
										</Distant>
										{purchase.state.usageReport && (
											<Distant>
												<span>購入完了</span>
												<span className="shrink-0 italic">
													{formatCurrency(
														purchase.state.usageReport.actualUsage,
													)}
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
