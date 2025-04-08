import { Section, SectionTitle } from "~/components/common/container"
import { Badge } from "~/components/ui/badge"
import { errorRedirect, prisma } from "~/services/repository.server"
import { getSession, verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/member"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const student = await verifyStudent(request)
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
		.catch(errorRedirect(await getSession(request.headers.get("Cookie")), "/app/student", "パートが存在しません。"))
	return { part }
}
export default ({ loaderData: { part } }: Route.ComponentProps) => {
	const accountantIdSet = new Set(part.wallet.accountantStudents.map((accountant) => accountant.id))
	const leaderIdSet = new Set(part.leaders.map((leader) => leader.id))
	const studentsWithRoll = part.students
		.map((student) => ({
			...student,
			roll: (accountantIdSet.has(student.id) ? 2 : 0) + (leaderIdSet.has(student.id) ? 1 : 0),
		}))
		.sort((student) => -student.roll)

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
					{studentsWithRoll.map((student) => (
						<div key={student.id} className="flex flex-row justify-between">
							<span>{student.name}</span>
							<div className="flex flex-row gap-2">
								{student.roll % 4 && <Badge variant={"default"}>HR会計</Badge>}
								{student.roll % 2 && <Badge variant={"default"}>パート責任者</Badge>}
							</div>
						</div>
					))}
				</div>
			</Section>
		</>
	)
}
