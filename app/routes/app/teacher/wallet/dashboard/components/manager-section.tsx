import { Section, SectionTitle } from "~/components/common/container"
import { AccountantBadge, LeaderBadge, TeacherBadge } from "~/components/utility/manager-badge"

type ManagerSectionProps = {
	leaders: { id: string; name: string; part: { id: string; name: string } }[]
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
				{accountantStudents.map((accountant) => (
					<div key={accountant.id} className="flex justify-between items-center">
						<div>{accountant.name}</div>
						<AccountantBadge />
					</div>
				))}
				{leaders.map((leader) => (
					<div key={leader.id} className="flex justify-between items-center">
						<div>{leader.name}</div>
						<div className="flex flex-row gap-2">
							<LeaderBadge />
						</div>
					</div>
				))}
			</div>
		</Section>
	)
}
