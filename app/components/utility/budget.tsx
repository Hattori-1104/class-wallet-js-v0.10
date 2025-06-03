import { displayPercentage, formatCurrency } from "~/utilities/display"
import { Distant } from "../common/placement"

export const BudgetGauge = ({
	budget,
	actualUsage,
	plannedUsage,
}: { budget: number; actualUsage: number; plannedUsage: number }) => {
	return (
		<div className="bg-primary/20 rounded-full h-2 relative overflow-hidden">
			<div
				className="bg-primary/50 h-2 absolute w-full"
				style={{ transform: `translateX(-${(actualUsage / budget) * 100}%)` }}
			/>
			<div
				className="bg-primary h-2 absolute w-full"
				style={{
					transform: `translateX(-${((actualUsage + plannedUsage) / budget) * 100}%)`,
				}}
			/>
		</div>
	)
}

export function BudgetDescription({
	budget,
	actualUsage,
}: { budget: number; actualUsage: number }) {
	return (
		<Distant>
			<span className="text-lg">
				{displayPercentage(1 - actualUsage / budget)}
			</span>
			<span>
				<span className="text-lg">{formatCurrency(budget - actualUsage)}</span>
				<span className="text-muted-foreground"> / </span>
				<span className="text-muted-foreground">{formatCurrency(budget)}</span>
			</span>
		</Distant>
	)
}
