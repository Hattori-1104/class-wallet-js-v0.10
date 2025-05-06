import { HorizonContainer, Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { AccountantBadge, LeaderBadge, TeacherBadge } from "~/components/utility/manager-badge"
import { UserItem } from "~/components/utility/user"
import {
	prisma,
	purchaseItemSelectQuery,
	purchaseStateSelectQuery,
	walletWithTeacherWhereQuery,
} from "~/services/repository.server"
import { requireSession, verifyTeacher } from "~/services/session.server"
import type { Route } from "./+types/dashboard"

export const loader = async ({ request, params: { walletId } }: Route.LoaderArgs) => {
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
		</>
	)
}
