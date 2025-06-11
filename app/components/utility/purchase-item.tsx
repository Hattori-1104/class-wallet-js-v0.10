import type { Prisma } from "@prisma/client"
import type { FC } from "react"
import { Link } from "react-router"
import { formatCurrency, formatDiffDate } from "~/utilities/display"
import {
	type PurchaseWithState,
	purchaseActionLabel,
	recommendedAction,
} from "~/utilities/purchase-state"
import { Distant } from "../common/placement"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { Badge } from "../ui/badge"

type PurchaseItemProps = {
	type: "student" | "teacher"
	id: string
	purchase: Prisma.PurchaseGetPayload<{
		select: {
			id: true
			label: true
			completion: {
				select: {
					actualUsage: true
				}
			}
			plannedUsage: true
			requestedBy: {
				select: {
					name: true
				}
			}
			updatedAt: true
			canceled: true
		}
	}> &
		PurchaseWithState
}

export const PurchaseItem: FC<PurchaseItemProps> = ({ purchase, type, id }) => {
	return (
		<Link
			key={purchase.id}
			to={
				{
					student: `/app/student/part/${id}/purchase/${purchase.id}`,
					teacher: `/app/teacher/wallet/${id}/purchase/${purchase.id}`,
				}[type]
			}
		>
			<Alert>
				<AlertTitle>
					<Distant>
						<span className="font-bold">{purchase.label}</span>
						<span className="font-normal">
							{purchase.completion
								? `${formatCurrency(purchase.completion.actualUsage)}`
								: `（予定額）${formatCurrency(purchase.plannedUsage)}`}
						</span>
					</Distant>
				</AlertTitle>
				<AlertDescription className="gap-2">
					<Distant>
						<span>{purchase.requestedBy.name}</span>
						<span>{formatDiffDate(purchase.updatedAt)}</span>
					</Distant>
					<Distant>
						{purchase.canceled ? (
							<Badge variant="destructive">キャンセルされました</Badge>
						) : (
							<Badge>{purchaseActionLabel[recommendedAction(purchase)]}</Badge>
						)}
					</Distant>
				</AlertDescription>
			</Alert>
		</Link>
	)
}
