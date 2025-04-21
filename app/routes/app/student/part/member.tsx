import { Section, SectionTitle } from "~/components/common/container"
import { AccountantBadge, LeaderBadge } from "~/components/utility/manager-badge"
import { createErrorRedirect, prisma } from "~/services/repository.server"
import { getSession, verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/member"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const student = await verifyStudent(session)
	const errorRedirect = createErrorRedirect(session, "/app/student")
	const part = await prisma.part
		.findUniqueOrThrow({
			where: {
				id: params.partId,
				students: {
					some: {
						id: student,
					},
				},
			},
			select: {
				_count: {
					select: {
						students: true,
					},
				},
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
						teachers: {
							select: {
								id: true,
								name: true,
							},
						},
						accountantStudents: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
		})
		.catch(errorRedirect("パートが存在しません。").catch())
	return { part }
}
export default ({ loaderData: { part } }: Route.ComponentProps) => {
	return (
		<>
			<Section>
				<SectionTitle className="font-bold text-lg">教師</SectionTitle>
				<div className="space-y-4">
					{part.wallet.teachers.map((teacher) => (
						<div key={teacher.id}>{teacher.name}</div>
					))}
				</div>
			</Section>
			<Section>
				<SectionTitle className="flex flex-row items-baseline justify-between">
					<h1 className="font-bold text-lg">生徒</h1>
					<span className="text-muted-foreground">{part._count.students}人</span>
				</SectionTitle>
				<div className="space-y-4">
					{part.leaders.map((leader) => (
						<div key={leader.id} className="flex flex-row justify-between">
							<span>{leader.name}</span>
							<div className="flex flex-row gap-2">
								<LeaderBadge />
								{part.wallet.accountantStudents.some((accountant) => leader.id === accountant.id) && <AccountantBadge />}
							</div>
						</div>
					))}
					{part.students
						.filter((student) => !part.leaders.some((leader) => student.id === leader.id))
						.map((student) => (
							<div key={student.id}>
								<span>{student.name}</span>
							</div>
						))}
				</div>
			</Section>
		</>
	)
}
