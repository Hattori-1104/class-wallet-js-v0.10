import { Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import {
	AccountantBadge,
	LeaderBadge,
	TeacherBadge,
} from "~/components/utility/manager-badge"
import { UserItem } from "~/components/utility/user"
import { partWithUserWhereQuery, prisma } from "~/services/repository.server"
import { verifyStudent } from "~/services/route-module.server"
import { _createErrorRedirect, requireSession } from "~/services/session.server"
import type { Route } from "./+types/member"

export const loader = async ({
	request,
	params: { partId },
}: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	const errorRedirect = _createErrorRedirect(session, "/auth")
	const part = await prisma.part
		.findUniqueOrThrow({
			where: { ...partWithUserWhereQuery(partId, student.id) },
			include: {
				leaders: { select: { id: true, name: true } },
				students: { select: { id: true, name: true } },
				wallet: {
					select: {
						accountantStudents: { select: { id: true, name: true } },
						teachers: { select: { id: true, name: true } },
					},
				},
			},
		})
		.catch(errorRedirect("情報の取得に失敗しました。").catch())
	return { part }
}

export default ({ loaderData: { part } }: Route.ComponentProps) => {
	return (
		<>
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
							{part.leaders.some((leader) => leader.id === accountant.id) && (
								<LeaderBadge />
							)}
						</UserItem>
					))}
					{part.leaders
						.filter(
							(leader) =>
								!part.wallet.accountantStudents.some(
									(accountant) => leader.id === accountant.id,
								),
						)
						.map((leader, index) => (
							<UserItem key={leader.id + index} name={leader.name}>
								<LeaderBadge />
							</UserItem>
						))}
				</div>
			</Section>
			<Section>
				<SectionTitle>
					<Title>メンバー</Title>
				</SectionTitle>
				<div className="space-y-2">
					{part.students.map((student) => (
						<UserItem key={student.id} name={student.name} />
					))}
				</div>
			</Section>
		</>
	)
}
