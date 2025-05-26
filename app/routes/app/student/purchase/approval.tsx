import { Check, X } from "lucide-react"
import { useSubmit } from "react-router"
import {
	Section,
	SectionContent,
	SectionTitle,
} from "~/components/common/container"
import { Aside, Distant } from "~/components/common/placement"
import { NoData, Title } from "~/components/common/typography"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "~/components/ui/alert-dialog"
import { Button } from "~/components/ui/button"
import { prisma } from "~/services/repository.server"
import { entryStudentRoute } from "~/services/route-module.server"
import { errorBuilder, successBuilder } from "~/services/session.server"
import { formatDiffDate } from "~/utilities/display"
import type { Route } from "./+types/approval"

const queryIsInChargeQuery = async (partId: string, studentId: string) => {
	const student = await prisma.student.findUnique({
		where: {
			id: studentId,
			OR: [
				{
					parts: {
						some: {
							id: partId,
							leaders: { some: { id: studentId } },
						},
					},
				},
				{
					parts: {
						some: {
							id: partId,
							wallet: {
								accountantStudents: { some: { id: studentId } },
							},
						},
					},
				},
			],
		},
	})
	return Boolean(student)
}

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	// セッション情報の取得 & 検証
	const { partId, session, student } = await entryStudentRoute(
		request,
		params.partId,
	)
	const errorRedirect = errorBuilder(`/app/student/part/${partId}`, session)

	// データ取得
	const purchase = await prisma.purchase
		.findUniqueOrThrow({
			where: {
				id: params.purchaseId,
				part: {
					id: partId,
					students: { some: { id: student.id } },
				},
			},
			select: {
				id: true,
				label: true,
				canceled: true,
				accountantApproval: {
					select: {
						by: {
							select: {
								name: true,
							},
						},
						at: true,
						approved: true,
					},
				},
				teacherApproval: {
					select: {
						by: {
							select: {
								name: true,
							},
						},
						at: true,
						approved: true,
					},
				},
			},
		})
		.catch(() => errorRedirect("購入情報が見つかりません。"))
	const isInCharge = await queryIsInChargeQuery(partId, student.id)
	return { purchase, isInCharge }
}

export default ({
	loaderData: { purchase, isInCharge },
}: Route.ComponentProps) => {
	const submit = useSubmit()
	return (
		<Section>
			<SectionTitle>
				<Title>購入承認</Title>
			</SectionTitle>
			<SectionContent className="space-y-2">
				{purchase.accountantApproval ? (
					purchase.accountantApproval.approved ? (
						<Alert className="border-positive/50  text-positive">
							<Check />
							<AlertTitle>
								<span>
									{purchase.accountantApproval.by.name}によって承認されました。
								</span>
							</AlertTitle>
							<AlertDescription>
								{formatDiffDate(purchase.accountantApproval.at)}
							</AlertDescription>
						</Alert>
					) : (
						<Alert className="border-destructive/50 text-destructive">
							<X />
							<AlertTitle>
								<span>
									{purchase.accountantApproval.by.name}によって拒否されました。
								</span>
							</AlertTitle>
							<AlertDescription>
								{formatDiffDate(purchase.accountantApproval.at)}
							</AlertDescription>
						</Alert>
					)
				) : (
					<Alert>
						<AlertTitle>
							<Distant>
								<NoData>会計承認待ち</NoData>
								{isInCharge && (
									<Aside gap="sm">
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button variant="destructive">拒否</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>会計承認</AlertDialogTitle>
													<AlertDialogDescription>
														購入を拒否しますか？
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>キャンセル</AlertDialogCancel>
													<AlertDialogAction
														onClick={() =>
															submit({ action: "reject" }, { method: "post" })
														}
														asChild
													>
														<Button variant="destructive">拒否</Button>
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button variant="default">承認</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>会計承認</AlertDialogTitle>
													<AlertDialogDescription>
														購入を承認しますか？
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>キャンセル</AlertDialogCancel>
													<AlertDialogAction
														onClick={() =>
															submit({ action: "approve" }, { method: "post" })
														}
														asChild
													>
														<Button variant="default">承認</Button>
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</Aside>
								)}
							</Distant>
						</AlertTitle>
					</Alert>
				)}
				{purchase.teacherApproval ? (
					purchase.teacherApproval.approved ? (
						<Alert className="border-positive/50  text-positive">
							<Check />
							<AlertTitle>
								<span>
									{purchase.teacherApproval.by.name}によって承認されました。
								</span>
							</AlertTitle>
							<AlertDescription>
								{formatDiffDate(purchase.teacherApproval.at)}
							</AlertDescription>
						</Alert>
					) : (
						<Alert className="border-destructive/50 text-destructive">
							<X />
							<AlertTitle>
								<span>
									{purchase.teacherApproval.by.name}によって拒否されました。
								</span>
							</AlertTitle>
							<AlertDescription>
								{formatDiffDate(purchase.teacherApproval.at)}
							</AlertDescription>
						</Alert>
					)
				) : (
					<Alert>
						<AlertTitle>
							<NoData>教師承認待ち</NoData>
						</AlertTitle>
					</Alert>
				)}
			</SectionContent>
		</Section>
	)
}

export const action = async ({ request, params }: Route.ActionArgs) => {
	const { partId, session, student } = await entryStudentRoute(
		request,
		params.partId,
	)
	const errorRedirect = errorBuilder(`/app/student/part/${partId}`, session)

	const isInCharge = await queryIsInChargeQuery(partId, student.id)
	if (!isInCharge) return await errorRedirect("権限がありません。")

	const formData = await request.formData()
	const action = formData.get("action")
	const successRedirect = successBuilder(
		`/app/student/part/${partId}/purchase/${params.purchaseId}`,
		session,
	)
	if (action === "reject") {
		await prisma.purchase
			.update({
				where: { id: params.purchaseId },
				data: {
					accountantApproval: {
						update: {
							by: { connect: { id: student.id } },
							approved: false,
						},
					},
				},
			})
			.catch(() => errorRedirect("購入の拒否に失敗しました。"))
		return successRedirect("購入を拒否しました。")
	}
	if (action === "approve") {
		await prisma.purchase
			.update({
				where: { id: params.purchaseId },
				data: {
					accountantApproval: {
						upsert: {
							update: {
								by: { connect: { id: student.id } },
								approved: true,
							},
							create: {
								by: { connect: { id: student.id } },
								approved: true,
							},
						},
					},
				},
			})
			.catch(() => errorRedirect("購入の承認に失敗しました。"))
		return successRedirect("購入を承認しました。")
	}
	return null
}
