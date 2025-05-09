import { Badge } from "~/components/ui/badge"

export const LeaderBadge = ({ partName }: { partName?: string }) => {
	return (
		<>
			<Badge variant="default">{partName ? `${partName}責任者` : "パート責任者"}</Badge>
		</>
	)
}

export const AccountantBadge = () => {
	return <Badge variant="default">HR会計</Badge>
}

export const TeacherBadge = () => {
	return <Badge variant="default">担任教師</Badge>
}
