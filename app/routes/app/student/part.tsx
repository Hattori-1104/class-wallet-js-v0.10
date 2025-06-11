import { Plus } from "lucide-react"
import { type FC, useEffect, useState } from "react"
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
import { Button } from "~/components/ui/button"
import { BudgetSectionContent } from "~/components/utility/budget"
import { PurchaseItem } from "~/components/utility/purchase-item"
import { RevalidateButton } from "~/components/utility/revalidate-button"
import { queryPartBudgetInfo } from "~/route-modules/budget.server"
import { entryStudentRoute } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
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
		where: { id: partId },
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
	const budgetInfo = await queryPartBudgetInfo(partId)

	return { partId, part, ...budgetInfo }
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
				<Button className="block mt-8 mx-auto" disabled={Boolean(inviteUrl)}>
					<Link to={inviteUrl ?? "."}>クリップボードのURLから参加</Link>
				</Button>
			</Section>
		</>
	)
}

export default ({ loaderData }: Route.ComponentProps) => {
	if (!loaderData) return <NotBelongsTo />

	const { partId, part, plannedUsage, actualUsage } = loaderData

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
				<BudgetSectionContent
					budget={part.budget}
					actualUsage={actualUsage}
					plannedUsage={plannedUsage}
				/>
			</Section>
			<Section>
				<SectionTitle>
					<Distant>
						<Title>買い出し</Title>
						<RevalidateButton />
					</Distant>
				</SectionTitle>
				<SectionContent className="flex flex-col gap-2">
					{part.purchases.map((purchase) => (
						<PurchaseItem
							key={purchase.id}
							type="student"
							id={partId}
							purchase={purchase}
						/>
					))}
				</SectionContent>
			</Section>
		</>
	)
}
