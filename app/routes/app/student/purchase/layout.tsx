// import { Flag } from "lucide-react"
import { Outlet, useFetcher } from "react-router"
import { MainContainer, Section, SectionTitle } from "~/components/common/container"
import { Header, HeaderBackButton } from "~/components/common/header"
import { AsideEven, Distant } from "~/components/common/placement"
import { Title } from "~/components/common/typography"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "~/components/ui/alert-dialog"
import { Button } from "~/components/ui/button"
import { entryStudentPurchaseRoute } from "~/route-modules/common.server"
import { queryIsRequester } from "~/route-modules/purchase-state/common.server"
import { prisma } from "~/services/repository.server"
import { buildErrorRedirect } from "~/services/session.server"
import { formatCurrency } from "~/utilities/display"
import type { Route } from "./+types/layout"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { session, partId, purchaseId, student } = await entryStudentPurchaseRoute(request, params.purchaseId)
	const errorRedirect = buildErrorRedirect(`/app/student/part/${partId}`, session)

	// データ取得
	const purchase = await prisma.purchase
		.findUniqueOrThrow({
			where: { id: purchaseId },
			select: {
				id: true,
				label: true,
				canceled: true,
				plannedUsage: true,
				completion: {
					select: {
						actualUsage: true,
					},
				},
				requestedBy: {
					select: {
						name: true,
					},
				},
			},
		})
		.catch(() => errorRedirect("購入データが見つかりません。"))
	const isRequester = await queryIsRequester(purchaseId, student.id)
	return { purchase, partId, isRequester }
}

export default ({ loaderData: { purchase, isRequester, partId } }: Route.ComponentProps) => {
	const fetcher = useFetcher()
	return (
		<>
			<Header>
				<HeaderBackButton />
			</Header>
			<MainContainer>
				<Section>
					<SectionTitle>
						<Distant>
							<Title>{purchase.label}</Title>
							{purchase.completion ? (
								<>
									<span className="text-lg">{formatCurrency(purchase.completion.actualUsage)}</span>
								</>
							) : (
								<span>
									<span>（予定額）</span>
									<span className="text-lg">{formatCurrency(purchase.plannedUsage)}</span>
								</span>
							)}
						</Distant>
						<span className="text-muted-foreground">{purchase.requestedBy.name} さんがリクエスト</span>
					</SectionTitle>
				</Section>
				<Outlet />
				<Section>
					<AlertDialog>
						<AlertDialogTrigger>
							<Button variant="destructive">購入を取り消す</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>本当に購入を取り消しますか？</AlertDialogTitle>
								<AlertDialogFooter>
									<AsideEven>
										<AlertDialogCancel asChild>
											<Button variant="outline">キャンセル</Button>
										</AlertDialogCancel>
										<AlertDialogAction
											asChild
											onClick={() =>
												fetcher.submit("delete", {
													method: "post",
													action: `/app/student/part/${partId}/purchase/${purchase.id}/cancel`,
												})
											}
										>
											<Button variant="destructive">取り消す</Button>
										</AlertDialogAction>
									</AsideEven>
								</AlertDialogFooter>
							</AlertDialogHeader>
						</AlertDialogContent>
					</AlertDialog>
				</Section>
			</MainContainer>
		</>
	)
}
