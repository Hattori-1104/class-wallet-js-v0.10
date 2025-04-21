import { Check, Minus } from "lucide-react"
import { formatDiffDate } from "~/utilities/display"

export const Confirmation = ({
	completedBy,
	completedAt,
	message,
}: {
	completedBy: string
	completedAt: Date | null
	message: string
}) => {
	return completedAt !== null ? (
		<div className="border rounded-md px-4 py-2 border-sky-500">
			<div className="flex flex-row gap-4 items-center">
				<Check className="text-sky-500" />
				<div className="grow">
					<span className="ml-1">{completedBy}</span>
					<p className="italic text-xs text-muted-foreground">{message}</p>
				</div>
				<span className="shrink-0 text-sm text-muted-foreground">{formatDiffDate(completedAt, Date.now())}</span>
			</div>
		</div>
	) : (
		<div className="border rounded-md px-4 py-2">
			<div className="flex flex-row gap-4 items-center">
				<Minus className="text-muted-foreground" />
				<div>
					<span className="text-muted-foreground italic">未完了</span>
					<p className="italic text-xs text-muted-foreground">{message}</p>
				</div>
			</div>
		</div>
	)
}
