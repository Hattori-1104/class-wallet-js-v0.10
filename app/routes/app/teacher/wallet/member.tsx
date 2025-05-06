import { createErrorRedirect, verifyTeacher } from "~/services/session.server"

import { SectionTitle } from "~/components/common/container"
import { Section } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { AccountantBadge, LeaderBadge, TeacherBadge } from "~/components/utility/manager-badge"
import { UserItem } from "~/components/utility/user"
import { prisma } from "~/services/repository.server"
import { requireSession } from "~/services/session.server"
import type { Route } from "./+types/member"

export const loader = async ({ request, params: { walletId } }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const teacher = await verifyTeacher(session)

	const errorRedirect = createErrorRedirect(session, "/auth")
	const wallet = await prisma.wallet
		.findUniqueOrThrow({
			where: { id: walletId, teachers: { some: { id: teacher.id } } },
			include: {
				accountantStudents: { select: { id: true, name: true } },
				teachers: { select: { id: true, name: true } },
				parts: {
					include: {
						students: { select: { id: true, name: true } },
						leaders: { select: { id: true, name: true } },
					},
				},
			},
		})
		.catch(errorRedirect("情報の取得に失敗しました。").catch())

	return { wallet }
}

export default ({ loaderData: { wallet } }: Route.ComponentProps) => {
	return (
		<>
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
								<LeaderBadge />
							</UserItem>
						)),
					)}
				</div>
			</Section>
			{wallet.parts.map((part) => (
				<Section key={part.id}>
					<SectionTitle>
						<Title>{part.name}</Title>
					</SectionTitle>
					<div className="space-y-2">
						{part.students.map((student) => (
							<UserItem key={student.id} name={student.name} />
						))}
					</div>
				</Section>
			))}
		</>
	)
}
