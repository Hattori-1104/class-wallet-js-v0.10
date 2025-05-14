import { Plus } from "lucide-react"
import { Link } from "react-router"
import { LightBox } from "~/components/common/box"
import {
	Section,
	SectionContent,
	SectionTitle,
} from "~/components/common/container"
import { LinkButton } from "~/components/common/link-button"
import { Distant } from "~/components/common/placement"
import { NoData, Title } from "~/components/common/typography"
import { prisma } from "~/services/repository.server"
import { entryPartRoute } from "~/services/route-module.server"
import { formatDiffDate } from "~/utilities/display"
import type { Route } from "./+types/part"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	// セッション情報の取得 & 検証
	const { student, partId } = await entryPartRoute(request, params.partId)

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
					updatedAt: true,
				},
				orderBy: {
					updatedAt: "desc",
				},
			},
		},
	})

	return { partId, part }
}

export default ({ loaderData }: Route.ComponentProps) => {
	if (!loaderData)
		return (
			<>
				<Section>
					<NoData>パートに所属していません。</NoData>
				</Section>
			</>
		)
	const { partId, part } = loaderData
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
				{/* <SectionContent>
					<BudgetGauge
						budget={part.budget}
						plannedUsage={1000}
						actualUsage={2000}
					/>
				</SectionContent> */}
			</Section>
			<Section>
				<SectionTitle>
					<Title>買い出し</Title>
				</SectionTitle>
				<SectionContent className="flex flex-col gap-2">
					{part.purchases.map((purchase) => (
						<LightBox key={purchase.id} asChild>
							<Link to={`/app/student/part/${partId}/purchase/${purchase.id}`}>
								<Title>{purchase.label}</Title>
								<p>{purchase.description}</p>
								<p>{purchase.plannedUsage}</p>
								<p>{formatDiffDate(purchase.updatedAt)}</p>
							</Link>
						</LightBox>
					))}
				</SectionContent>
			</Section>
		</>
	)
}
