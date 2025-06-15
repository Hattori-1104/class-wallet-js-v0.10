import { Section, SectionContent, SectionTitle } from "~/components/common/container"
import { Distant } from "~/components/common/placement"
import { NoData, Title } from "~/components/common/typography"
import { BudgetSectionContent } from "~/components/utility/budget"
import { PurchaseItem } from "~/components/utility/purchase-item"
import { RevalidateButton } from "~/components/utility/revalidate-button"
import { queryWalletBudgetInfo } from "~/route-modules/budget.server"
import { entryStudentRoute } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import { buildErrorRedirect } from "~/services/session.server"
import type { Route } from "./+types/wallet"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	// セッション情報の取得 & 検証
	const { partId, session } = await entryStudentRoute(request, params.partId, true)

	// パートに所属していない場合
	if (!partId) return null

	const errorRedirect = buildErrorRedirect("/app/student", session)

	try {
		const wallet = await prisma.wallet.findFirstOrThrow({
			where: { parts: { some: { id: partId } } },
			select: {
				id: true,
				name: true,
				budget: true,
				parts: {
					select: {
						id: true,
						name: true,
						budget: true,
					},
				},
			},
		})
		const purchases = await prisma.purchase.findMany({
			where: { part: { wallet: { id: wallet.id } } },
			select: {
				id: true,
				label: true,
				completion: {
					select: {
						actualUsage: true,
					},
				},
				plannedUsage: true,
				requestedBy: {
					select: {
						name: true,
					},
				},
				updatedAt: true,
				canceled: true,
				part: {
					select: {
						id: true,
					},
				},
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
				receiptSubmission: {
					select: {
						receiptIndex: true,
					},
				},
			},
			orderBy: {
				updatedAt: "desc",
			},
		})
		const budgetInfo = await queryWalletBudgetInfo(wallet.id)
		return { wallet, ...budgetInfo, purchases }
	} catch (_) {
		console.log(_)
		throw await errorRedirect("エラーが発生しました。")
	}
}

export default ({ loaderData }: Route.ComponentProps) => {
	if (!loaderData)
		return (
			<Section>
				<NoData>ウォレットに所属していません。</NoData>
			</Section>
		)

	const { wallet, walletBudgetInfo, partsBudgetInfo, purchases } = loaderData

	return (
		<>
			<Section>
				<BudgetSectionContent budget={wallet.budget} {...walletBudgetInfo} className="space-y-2">
					<Title>{wallet.name}</Title>
				</BudgetSectionContent>
			</Section>

			<Section>
				{wallet.parts.map((part) => (
					<BudgetSectionContent
						key={part.id}
						{...(partsBudgetInfo.find((budgetInfo) => budgetInfo.id === part.id) ?? {
							actualUsage: 0,
							plannedUsage: 0,
							budget: part.budget,
						})}
						className="space-y-2 my-4"
					>
						<Title>{part.name}</Title>
					</BudgetSectionContent>
				))}
			</Section>
			<Section>
				<SectionTitle>
					<Distant>
						<Title>買い出し</Title>
						<RevalidateButton />
					</Distant>
				</SectionTitle>
				<SectionContent className="flex flex-col gap-2">
					{purchases.map((purchase) => (
						<PurchaseItem key={purchase.id} type="student" purchase={purchase} id={purchase.part.id} />
					))}
				</SectionContent>
			</Section>
		</>
	)
}
