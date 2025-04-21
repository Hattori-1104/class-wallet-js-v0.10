import { Section, SectionTitle } from "~/components/common/container"
import { AccountantBadge, LeaderBadge, TeacherBadge } from "~/components/utility/manager-badge"

type ManagerSectionProps = {
	leaders: { id: string; name: string }[]
	accountantStudents: { id: string; name: string }[]
	teachers: { id: string; name: string }[]
}

export function ManagerSection({ leaders, accountantStudents, teachers }: ManagerSectionProps) {
	return (
		<Section>
			<SectionTitle className="font-bold text-lg">責任者</SectionTitle>
			<div className="space-y-2">
				{teachers.map((teacher) => (
					<div key={teacher.id} className="flex justify-between items-center">
						<div>{teacher.name}</div>
						<TeacherBadge />
					</div>
				))}
				{leaders.map((leader) => (
					<div key={leader.id} className="flex justify-between items-center">
						<div>{leader.name}</div>
						<div className="flex flex-row gap-2">
							<LeaderBadge />
							{accountantStudents.some((accountant) => leader.id === accountant.id) && <AccountantBadge />}
						</div>
					</div>
				))}
			</div>
			{leaders.length + accountantStudents.length + teachers.length === 0 && (
				<div className="text-sm text-center text-muted-foreground">責任者がいません</div>
			)}
		</Section>
	)
}
