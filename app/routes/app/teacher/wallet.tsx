import { type FC, useEffect, useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import z from "zod"
import { Section, SectionContent, SectionTitle } from "~/components/common/container"
import { Distant } from "~/components/common/placement"
import { NoData, Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { BudgetSectionContent } from "~/components/utility/budget"
import { PurchaseItem } from "~/components/utility/purchase-item"
import { RevalidateButton } from "~/components/utility/revalidate-button"
import { queryWalletBudgetInfo } from "~/route-modules/budget.server"
import { entryTeacherRoute } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import { buildErrorRedirect } from "~/services/session.server"
import type { Route } from "./+types/wallet"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { session, walletId } = await entryTeacherRoute(request, params.walletId, false)

	if (!walletId) return null

	const errorRedirect = buildErrorRedirect("/app/teacher", session)

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
					},
				},
			},
		})

		if (!wallet) {
			throw await errorRedirect("ウォレットが見つかりません。")
		}

		const purchases = await prisma.purchase.findMany({
			where: {
				part: {
					wallet: {
						id: walletId,
					},
				},
			},
			select: {
				id: true,
				part: {
					select: {
						id: true,
					},
				},
				label: true,
				description: true,
				plannedUsage: true,
				requestedBy: {
					select: {
						id: true,
						name: true,
					},
				},
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
		})
		const budgetInfo = await queryWalletBudgetInfo(walletId)

		return {
			wallet,
			walletId,
			...budgetInfo,
			purchases,
		}
	} catch (_) {
		throw await errorRedirect("ウォレット情報の取得に失敗しました。")
	}
}

const NotBelongsTo: FC = () => {
	const [inviteUrl, setInviteUrl] = useState<string | null>()
	const inviteUrlSchema = z.string().url()
	useEffect(() => {
		const process = async () => {
			try {
				const clipboardData = await navigator.clipboard.readText()
				inviteUrlSchema.parse(clipboardData)
				setInviteUrl(clipboardData)
			} catch (_) {
				toast.error("招待リンクがコピーされていません。")
				setInviteUrl(null)
			}
		}
		process()
	}, [inviteUrlSchema.parse])

	return (
		<>
			<Section>
				<NoData className="block">パートに所属していません。</NoData>
				<Button className="block mt-8 mx-auto" disabled={Boolean(inviteUrl) === false}>
					<Link to={inviteUrl ?? "."}>クリップボードのURLから参加</Link>
				</Button>
			</Section>
		</>
	)
}

export default ({ loaderData }: Route.ComponentProps) => {
	if (!loaderData) return <NotBelongsTo />

	const { wallet, walletId, walletBudgetInfo, partsBudgetInfo, purchases } = loaderData
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
							plannedUsage: 0,
							actualUsage: 0,
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
						<PurchaseItem key={purchase.id} type="teacher" purchase={purchase} id={walletId} />
					))}
				</SectionContent>
			</Section>
		</>
	)
}
