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
				style={{ transform: `translateX(-${((actualUsage + plannedUsage) / budget) * 100}%)` }}
			/>
		</div>
	)
}
