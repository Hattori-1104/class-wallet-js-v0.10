import { Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import z from "zod"
import {
	Section,
	SectionContent,
	SectionTitle,
} from "~/components/common/container"
import { LinkButton } from "~/components/common/link-button"
import { Distant } from "~/components/common/placement"
import { NoData, Title } from "~/components/common/typography"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import { BudgetDescription, BudgetGauge } from "~/components/utility/budget"
import { entryStudentRoute } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import { formatCurrency, formatDiffDate } from "~/utilities/display"
import {
	type PurchaseAction,
	recommendedAction,
} from "~/utilities/purchase-state"
import type { Route } from "./+types/part"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	// セッション情報の取得 & 検証
	const { student, partId } = await entryStudentRoute(
		request,
		params.partId,
		false,
	)

	// パートに所属していない場合
	if (!partId) return null

	// データを取得
	// FIXME: エラーハンドリングが未実装
	const part = await prisma.part.findUniqueOrThrow({
		where: { id: partId, students: { some: { id: student.id } } },
		select: {
			id: true,
			name: true,
			budget: true,
			purchases: {
				select: {
					id: true,
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
			},
		},
	})
	const purchaseInProgress = await prisma.purchase.findMany({
		where: {
			partId: partId,
			receiptSubmission: null,
			canceled: false,
		},
		select: {
			plannedUsage: true,
		},
	})
	const wholePlannedUsage = purchaseInProgress.reduce(
		(acc, purchase) => acc + purchase.plannedUsage,
		0,
	)
	const purchaseCompleted = await prisma.purchase.findMany({
		where: {
			partId: partId,
			receiptSubmission: { isNot: null },
			canceled: false,
		},
		select: {
			completion: {
				select: {
					actualUsage: true,
				},
			},
		},
	})
	const wholeActualUsage = purchaseCompleted.reduce(
		(acc, purchase) => acc + (purchase.completion?.actualUsage ?? 0),
		0,
	)

	return { partId, part, wholePlannedUsage, wholeActualUsage }
}

export default ({ loaderData }: Route.ComponentProps) => {
	const [inviteUrl, setInviteUrl] = useState("")
	const inviteUrlSchema = z.string().url()
	useEffect(() => {
		try {
			navigator.clipboard.readText().then((url) => {
				inviteUrlSchema.parse(url)
				setInviteUrl(url)
			})
		} catch (_) {
			toast.error("リンクのコピーに失敗しました")
		}
	}, [inviteUrlSchema.parse])
	if (!loaderData) {
		return (
			<>
				<Section>
					<NoData className="block">パートに所属していません。</NoData>
					<Button className="block mt-8 mx-auto">
						<Link to={inviteUrl}>クリップボードのURLから参加</Link>
					</Button>
				</Section>
			</>
		)
	}
	const { partId, part, wholePlannedUsage, wholeActualUsage } = loaderData
	const purchaseActionLabel: Record<PurchaseAction, string> = {
		approval: "承認待ち",
		completion: "買い出し中",
		receiptSubmission: "レシート提出待ち",
		completed: "完了",
	}

	return (
		<>
			<Section>
				<SectionTitle>
					<Distant>
						<Title>{part.name}</Title>
						<LinkButton
							label="買い出しリクエスト"
							absoluteTo={`/app/student/part/${partId}/purchase/new`}
							Icon={Plus}
						/>
					</Distant>
				</SectionTitle>
				<SectionContent className="space-y-2">
					<BudgetDescription
						budget={part.budget}
						actualUsage={wholeActualUsage}
					/>
					<BudgetGauge
						budget={part.budget}
						plannedUsage={wholePlannedUsage}
						actualUsage={wholeActualUsage}
					/>
				</SectionContent>
			</Section>
			<Section>
				<SectionTitle>
					<Title>買い出し</Title>
				</SectionTitle>
				<SectionContent className="flex flex-col gap-2">
					{part.purchases.map((purchase) => (
						<Link
							key={purchase.id}
							to={`/app/student/part/${partId}/purchase/${purchase.id}`}
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
								<AlertDescription>
									<Distant>
										<span>{purchase.requestedBy.name}</span>
									</Distant>
									<Distant>
										{purchase.canceled ? (
											<span className="text-destructive">
												キャンセルされました。
											</span>
										) : (
											<span>
												{purchaseActionLabel[recommendedAction(purchase)]}
											</span>
										)}

										<span>{formatDiffDate(purchase.updatedAt)}</span>
									</Distant>
								</AlertDescription>
							</Alert>
						</Link>
					))}
				</SectionContent>
			</Section>
		</>
	)
}
