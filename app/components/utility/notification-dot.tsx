import { Badge } from "~/components/ui/badge"

export const NotificationDot = ({ count }: { count: number }) => {
	return (
		<>
			{count > 0 && (
				<Badge variant="destructive" className="rounded-full">
					{count}件
				</Badge>
			)}
		</>
	)
}
