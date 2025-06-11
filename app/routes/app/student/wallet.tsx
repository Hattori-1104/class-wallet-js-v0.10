import { Section } from "~/components/common/container"
import { NoData, Title } from "~/components/common/typography"
import { BudgetSectionContent } from "~/components/utility/budget"
import { entryStudentRoute } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import { errorBuilder } from "~/services/session.server"
import type { Route } from "./+types/wallet"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	// セッション情報の取得 & 検証
	const { student, session, partId } = await entryStudentRoute(
		request,
		params.partId,
		false,
	)

	// パートに所属していない場合
	if (!partId) return null

	const errorRedirect = errorBuilder("/app/student", session)

	try {
		// ウォレット情報を取得
		const wallet = await prisma.wallet.findFirst({
			where: {
				parts: { some: { id: partId, students: { some: { id: student.id } } } },
			},
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
			<Section>
				<NoData>ウォレットに所属していません。</NoData>
			</Section>
		)

	const { wallet, totalPlannedUsage, totalActualUsage } = loaderData

	return (
		<>
			<Section>
				<BudgetSectionContent
					budget={wallet.budget}
					plannedUsage={totalPlannedUsage}
					actualUsage={totalActualUsage}
					className="space-y-2"
				>
					<Title>{wallet.name}</Title>
				</BudgetSectionContent>
			</Section>

			<Section>
				{wallet.parts.map((part) => (
					<BudgetSectionContent
						key={part.id}
						budget={part.budget}
						plannedUsage={part.plannedUsage}
						actualUsage={part.actualUsage}
						className="space-y-2 my-4"
					>
						<Title>{part.name}</Title>
					</BudgetSectionContent>
				))}
			</Section>
		</>
	)
}
