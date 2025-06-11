import type { FC, ReactNode } from "react"
import { displayPercentage, formatCurrency } from "~/utilities/display"
import { SectionContent } from "../common/container"
import { Distant } from "../common/placement"

type BudgetGaugeProps = {
	budget: number
	actualUsage: number
	plannedUsage: number
}

export const BudgetGauge: FC<BudgetGaugeProps> = ({
	actualUsage,
	plannedUsage,
	budget,
}) => {
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

type BudgetDescriptionProps = {
	budget: number
	actualUsage: number
}

export const BudgetDescription: FC<BudgetDescriptionProps> = ({
	actualUsage,
	budget,
}) => {
	return (
		<Distant>
			<span>
				<span className="text-xl">{formatCurrency(budget - actualUsage)}</span>
				<span className="text-muted-foreground"> / </span>
				<span className="text-muted-foreground">{formatCurrency(budget)}</span>
			</span>
			<span className="text-lg">
				{displayPercentage(1 - actualUsage / budget)}
			</span>
		</Distant>
	)
}

type BudgetSectionContentProps = BudgetDescriptionProps & BudgetGaugeProps

export const BudgetSectionContent: FC<
	BudgetSectionContentProps & { children?: ReactNode; className?: string }
> = (props) => {
	return (
		<SectionContent className={props.className}>
			{props.children}
			<div className="space-y-1">
				<BudgetDescription {...props} />
				<BudgetGauge {...props} />
			</div>
		</SectionContent>
	)
}
