import { Link } from "react-router"
import { LightBox } from "~/components/common/box"
import { HorizonContainer, Section, SectionTitle } from "~/components/common/container"
import { Distant } from "~/components/common/placement"
import { Heading, NoData, Note, Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { AccountantBadge, TeacherBadge } from "~/components/utility/manager-badge"
import { LeaderBadge } from "~/components/utility/manager-badge"
import { NotificationDot } from "~/components/utility/notification-dot"
import { UserItem } from "~/components/utility/user"
import {
	partPersonInChargeSelectQuery,
	partWithUserWhereQuery,
	prisma,
	purchaseItemSelectQuery,
	purchaseStateSelectQuery,
} from "~/services/repository.server"
import { requireSession } from "~/services/session.server"
import { verifyStudent } from "~/services/session.server"
import { computePlannedUsage } from "~/utilities/compute"
import { formatDiffDate, formatMoney } from "~/utilities/display"
import type { Route } from "./+types/dashboard"

export const loader = async ({ request, params: { partId } }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	const [part, purchasesInProgress] = await Promise.all([
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
				...partPersonInChargeSelectQuery({
					wallet: {
						select: {
							name: true,
						},
					},
				}),
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
					select: purchaseStateSelectQuery(),
				},
			},
			orderBy: {
				state: {
					updatedAt: "desc",
				},
			},
		}),
	])

	return { part, purchasesInProgress }
}

export default ({ loaderData: { part, purchasesInProgress } }: Route.ComponentProps) => {
	return (
		<>
			<Section>
				<SectionTitle className="flex flex-row items-center justify-between">
					<div>
						<Title>{part.name}</Title>
						<Note>{part.wallet.name}</Note>
					</div>
					<Button asChild>
						<Link to={`/app/student/part/${part.id}/purchase/new`}>購入をリクエスト</Link>
					</Button>
				</SectionTitle>
			</Section>
			<HorizonContainer>
				<Section>
					<SectionTitle>
						<Title>残り予算</Title>
					</SectionTitle>
				</Section>
				<Section>
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
				</Section>
			</HorizonContainer>
			<Section>
				<SectionTitle>
					<Distant>
						<Title>進行中の購入</Title>
						<NotificationDot count={purchasesInProgress.length} />
					</Distant>
				</SectionTitle>
				<div className="space-y-4">
					{purchasesInProgress.length > 0 ? (
						purchasesInProgress.map((purchase, index) => (
							<Link key={purchase.id + index} to={`/app/student/part/${part.id}/purchase/${purchase.id}`}>
								<LightBox className="space-y-2">
									<Distant>
										<Heading className="shrink text-wrap">{purchase.label}</Heading>
										<Note className="shrink-0">{formatDiffDate(purchase.updatedAt, Date.now())}</Note>
									</Distant>
									{/* 保留！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！ */}
									<Distant>
										<span>{purchase.state?.requests[0]?.by.name}がリクエスト</span>
										<span className="italic">{formatMoney(computePlannedUsage(purchase))}</span>
									</Distant>
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
