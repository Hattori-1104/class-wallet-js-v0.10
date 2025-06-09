import type { Prisma } from "@prisma/client"
import { Check, CircleAlert, Flag } from "lucide-react"
import { useSubmit } from "react-router"
import { SectionContent } from "~/components/common/container"
import { Distant } from "~/components/common/placement"
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
import { formatCurrency } from "~/utilities/display"
import type { PurchaseReceiptSubmissionSelectQuery } from "./receipt-submission.server"
type PurchaseReceiptSubmissionSectionContentProps = {
	purchase: Prisma.PurchaseGetPayload<{
		select: PurchaseReceiptSubmissionSelectQuery
	}>
	isAccountant: boolean
	isRequester: boolean
}

export function PurchaseReceiptSubmissionSectionContent(
	props: PurchaseReceiptSubmissionSectionContentProps,
) {
	return (
		<>
			<SectionContent>
				{props.purchase.completion ? (
					props.purchase.receiptSubmission ? (
						<>
							<div className="my-4">
								<div>レシート番号</div>
								<div className="text-center text-4xl ">
									{props.purchase.receiptSubmission.receiptIndex}
								</div>
							</div>
							<Alert variant="positive">
								<Check />
								<AlertTitle>レシート受け取り完了</AlertTitle>
								<AlertDescription>
									{props.purchase.requestedBy.name} が受け取りました。
								</AlertDescription>
							</Alert>
						</>
					) : props.isAccountant ? (
						<Alert>
							<AlertTitle>
								<Distant>
									<span>レシート提出待ち</span>
									<ReceiptSubmissionForm
										label={props.purchase.label}
										requesterName={props.purchase.requestedBy.name}
										actualUsage={props.purchase.completion.actualUsage}
									/>
								</Distant>
							</AlertTitle>
							<AlertDescription>
								<span>
									{props.purchase.requestedBy.name} さんからの受け取り
								</span>
							</AlertDescription>
						</Alert>
					) : props.isRequester ? (
						<Alert>
							<Flag />
							<AlertTitle>HR会計にレシートを提出してください。</AlertTitle>
						</Alert>
					) : (
						<Alert>
							<AlertTitle>レシート提出待ち</AlertTitle>
						</Alert>
					)
				) : (
					<Alert>
						<CircleAlert />
						<AlertTitle>先に買い出しを完了してください。</AlertTitle>
					</Alert>
				)}
			</SectionContent>
		</>
	)
}

type ReceiptSubmissionFormProps = {
	label: string
	requesterName: string
	actualUsage: number
}
function ReceiptSubmissionForm(props: ReceiptSubmissionFormProps) {
	const submit = useSubmit()
	return (
		<>
			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button>受理</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>レシート提出</AlertDialogTitle>
						<AlertDialogDescription>
							受け取るレシートを確認してください
						</AlertDialogDescription>
					</AlertDialogHeader>
					<Alert>
						<AlertTitle>
							<Distant>
								<span>{props.label}</span>
								<span>{formatCurrency(props.actualUsage)}</span>
							</Distant>
						</AlertTitle>
						<AlertDescription>
							<span>{props.requesterName} さんからの受け取り</span>
						</AlertDescription>
					</Alert>
					<AlertDialogFooter>
						<AlertDialogCancel>キャンセル</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								submit({ receiptSubmission: "accepted" }, { method: "post" })
							}
							asChild
						>
							<Button>受理</Button>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
