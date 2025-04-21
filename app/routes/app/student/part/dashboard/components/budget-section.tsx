import { Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { BudgetGauge } from "~/components/utility/gauge"
import { displayPercent } from "~/utilities/display"
import { formatMoney } from "~/utilities/display"

export function BudgetSection({
	budget,
	usage,
	plannedUsage,
	purchaseCountInProgress: purchaseInProgress,
}: { budget: number; usage: number; plannedUsage: number; purchaseCountInProgress: number }) {
	return (
		<Section>
			<SectionTitle>
				<Title>残り予算</Title>
			</SectionTitle>
			<div className="space-y-2">
				<div className="flex flex-row justify-between items-baseline">
					<div className="text-sm text-muted-foreground">{displayPercent(budget - usage, budget)}</div>
					<div className="flex flex-row items-baseline gap-1">
						<span className="text-lg text-semibold">{formatMoney(budget - usage)}</span>
						<span className="text-sm text-muted-foreground">/</span>
						<span className="text-sm text-muted-foreground">{formatMoney(budget)}</span>
					</div>
				</div>
				<BudgetGauge budget={budget} usage={usage} plannedUsage={plannedUsage} />
				<div className="flex flex-row justify-between items-baseline">
					<div className="text-sm text-muted-foreground">使用予定</div>
					<div className="flex flex-row items-baseline gap-1">
						<span className="text-semibold">{formatMoney(plannedUsage)}</span>
						<span className="text-sm text-muted-foreground">:</span>
						<span className="text-sm text-muted-foreground">{purchaseInProgress}件</span>
					</div>
				</div>
			</div>
		</Section>
	)
}
