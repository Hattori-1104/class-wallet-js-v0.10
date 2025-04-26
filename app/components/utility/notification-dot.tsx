import { Badge } from "~/components/ui/badge"

export const NotificationDot = ({ count }: { count: number }) => {
	return (
		<>
			{count > 0 ? (
				count > 10 ? (
					<Badge variant="destructive" className="rounded-full">
						+10件
					</Badge>
				) : (
					<Badge variant="destructive" className="rounded-full">
						{count}件
					</Badge>
				)
			) : (
				<Badge variant="outline" className="rounded-full">
					0件
				</Badge>
			)}
		</>
	)
}
