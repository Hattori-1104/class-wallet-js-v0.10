import { Link } from "react-router"
import {
	Section,
	SectionContent,
	SectionTitle,
} from "~/components/common/container"
import { Distant } from "~/components/common/placement"
import { NoData, Title } from "~/components/common/typography"
import { AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Alert } from "~/components/ui/alert"
import { BudgetDescription, BudgetGauge } from "~/components/utility/budget"
import { entryTeacherRoute } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import { errorBuilder } from "~/services/session.server"
import { formatCurrency, formatDiffDate } from "~/utilities/display"
import {
	type PurchaseAction,
	recommendedAction,
} from "~/utilities/purchase-state"
import type { Route } from "./+types/wallet"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { teacher, session, walletId } = await entryTeacherRoute(
		request,
		params.walletId,
		false,
	)

	if (!walletId) return null

	const errorRedirect = errorBuilder("/app/teacher", session)

	try {
		const wallet = await prisma.wallet.findFirst({
			where: { id: walletId },
			select: {
				id: true,
				name: true,
				budget: true,
				parts: {
					select: {
						id: true,
						name: true,
						budget: true,
						isBazaar: true,
						purchases: {
							select: {
								id: true,
								label: true,
								description: true,
								requestedBy: {
									select: {
										name: true,
										id: true,
									},
								},
								plannedUsage: true,
								updatedAt: true,
								canceled: true,
								accountantApproval: {
									select: {
										approved: true,
									},
								},
								teacherApproval: {
									select: {
										approved: true,
									},
								},
								completion: {
									select: {
										actualUsage: true,
									},
								},
								receiptSubmission: {
									select: {
										receiptIndex: true,
									},
								},
							},
							orderBy: {
								updatedAt: "desc",
							},
						},
					},
				},
			},
		})

		if (!wallet) {
			throw await errorRedirect("ウォレットが見つかりません。")
		}

		// 各パートの進行中の購入（予定額）を取得
		const purchasesInProgress = await prisma.purchase.findMany({
			where: {
				partId: { in: wallet.parts.map((part) => part.id) },
				receiptSubmission: null,
				canceled: false,
			},
			select: {
				partId: true,
				plannedUsage: true,
			},
		})

		// 各パートの完了した購入（実際の使用額）を取得
		const purchasesCompleted = await prisma.purchase.findMany({
			where: {
				partId: { in: wallet.parts.map((part) => part.id) },
				receiptSubmission: { isNot: null },
				canceled: false,
			},
			select: {
				partId: true,
				completion: {
					select: {
						actualUsage: true,
					},
				},
			},
		})

		// 各パートの予算使用状況を計算
		const partsWithBudgetInfo = wallet.parts.map((part) => {
			const plannedUsage = purchasesInProgress
				.filter((p) => p.partId === part.id)
				.reduce((sum, p) => sum + p.plannedUsage, 0)

			const actualUsage = purchasesCompleted
				.filter((p) => p.partId === part.id)
				.reduce((sum, p) => sum + (p.completion?.actualUsage || 0), 0)

			return {
				...part,
				plannedUsage,
				actualUsage,
			}
		})

		// ウォレット全体の予算使用状況を計算
		const totalPlannedUsage = partsWithBudgetInfo.reduce(
			(sum, part) => sum + part.plannedUsage,
			0,
		)
		const totalActualUsage = partsWithBudgetInfo.reduce(
			(sum, part) => sum + part.actualUsage,
			0,
		)

		return {
			wallet: {
				...wallet,
				parts: partsWithBudgetInfo,
			},
			walletId,
			totalPlannedUsage,
			totalActualUsage,
		}
	} catch (error) {
		console.error("ウォレット情報の取得に失敗しました:", error)
		throw await errorRedirect("ウォレット情報の取得に失敗しました。")
	}
}

export default ({ loaderData }: Route.ComponentProps) => {
	if (!loaderData)
		return (
			<>
				<Section>
					<NoData>ウォレットに所属していません。</NoData>
				</Section>
			</>
		)

	const { wallet, walletId, totalPlannedUsage, totalActualUsage } = loaderData
	const purchaseActionLabel: Record<PurchaseAction, string> = {
		approval: "承認待ち",
		completion: "買い出し中",
		receiptSubmission: "レシート提出待ち",
		completed: "完了",
	}

	return (
		<>
			{/* ウォレット全体の予算状況 */}
			<Section>
				<SectionTitle>
					<Title>{wallet.name}</Title>
				</SectionTitle>
				<SectionContent className="space-y-2">
					<BudgetDescription
						budget={wallet.budget}
						actualUsage={totalActualUsage}
					/>
					<BudgetGauge
						budget={wallet.budget}
						plannedUsage={totalPlannedUsage}
						actualUsage={totalActualUsage}
					/>
				</SectionContent>
			</Section>

			{/* 各パートの予算状況 */}
			{wallet.parts.map((part) => (
				<Section key={part.id}>
					<SectionTitle>
						<Distant>
							<Title>{part.name}</Title>
							{part.isBazaar && (
								<span className="text-sm text-muted-foreground">バザー</span>
							)}
						</Distant>
					</SectionTitle>
					<SectionContent className="space-y-2">
						<BudgetDescription
							budget={part.budget}
							actualUsage={part.actualUsage}
						/>
						<BudgetGauge
							budget={part.budget}
							plannedUsage={part.plannedUsage}
							actualUsage={part.actualUsage}
						/>
					</SectionContent>
				</Section>
			))}

			{/* 買い出し一覧 */}
			<Section>
				<SectionTitle>
					<Title>買い出し</Title>
				</SectionTitle>
				<SectionContent className="flex flex-col gap-2">
					{wallet.parts.map((part) =>
						part.purchases
							.filter((purchase) => !purchase.canceled)
							.map((purchase) => (
								<Link
									key={purchase.id}
									to={`/app/teacher/wallet/${walletId}/purchase/${purchase.id}`}
								>
									<Alert>
										<AlertTitle>
											<Distant>
												<span className="font-bold">{purchase.label}</span>
												<span className="font-normal">
													{purchase.completion
														? formatCurrency(purchase.completion.actualUsage)
														: `（予定額）${formatCurrency(purchase.plannedUsage)}`}
												</span>
											</Distant>
										</AlertTitle>
										<AlertDescription>
											<Distant>
												<span>{purchase.requestedBy.name}</span>
											</Distant>
											<Distant>
												<div className="flex flex-col gap-1">
													<span>{purchase.description}</span>
													<span>
														{purchaseActionLabel[recommendedAction(purchase)]}
													</span>
												</div>
												<span>{formatDiffDate(purchase.updatedAt)}</span>
											</Distant>
										</AlertDescription>
									</Alert>
								</Link>
							)),
					)}
				</SectionContent>
			</Section>
		</>
	)
}
