import type { Prisma } from "@prisma/client"
import { Slot } from "@radix-ui/react-slot"
import { X } from "lucide-react"
import { Check } from "lucide-react"
import { useSubmit } from "react-router"
import { SectionContent } from "~/components/common/container"
import { Distant } from "~/components/common/placement"
import { Aside } from "~/components/common/placement"
import { NoData } from "~/components/common/typography"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { AlertDialogTrigger } from "~/components/ui/alert-dialog"
import { AlertDialogTitle } from "~/components/ui/alert-dialog"
import { AlertDialogDescription } from "~/components/ui/alert-dialog"
import { AlertDialogHeader } from "~/components/ui/alert-dialog"
import { AlertDialogCancel } from "~/components/ui/alert-dialog"
import { AlertDialogAction } from "~/components/ui/alert-dialog"
import { AlertDialogFooter } from "~/components/ui/alert-dialog"
import { AlertDialogContent } from "~/components/ui/alert-dialog"
import { AlertDialog } from "~/components/ui/alert-dialog"
import { Button } from "~/components/ui/button"
import { formatDiffDate } from "~/utilities/display"
import type { PurchaseApprovalSelectQuery } from "./approval.server"

type PurchaseApprovalSectionContentProps = {
	purchase: Prisma.PurchaseGetPayload<{
		select: PurchaseApprovalSelectQuery
	}>
	userType: "student" | "teacher"
	isInCharge: boolean
}
export const PurchaseApprovalSectionContent = (
	props: PurchaseApprovalSectionContentProps,
) => {
	return (
		<SectionContent className="flex flex-col gap-4">
			<AccountantApproval {...props} />
			<TeacherApproval {...props} />
		</SectionContent>
	)
}

function AccountantApproval({
	purchase,
	isInCharge,
	userType,
}: PurchaseApprovalSectionContentProps) {
	return (
		<Slot>
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
							{isInCharge && userType === "student" && (
								<AccountantApprovalInCharge />
							)}
						</Distant>
					</AlertTitle>
				</Alert>
			)}
		</Slot>
	)
}

function AccountantApprovalInCharge() {
	const submit = useSubmit()
	return (
		<>
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
								onClick={() => submit({ action: "reject" }, { method: "post" })}
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
		</>
	)
}

function TeacherApproval({
	purchase,
	isInCharge,
	userType,
}: PurchaseApprovalSectionContentProps) {
	return (
		<Slot>
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
						<Distant>
							<NoData>教師承認待ち</NoData>
							{isInCharge && userType === "teacher" && (
								<TeacherApprovalInCharge />
							)}
						</Distant>
					</AlertTitle>
				</Alert>
			)}
		</Slot>
	)
}

function TeacherApprovalInCharge() {
	const submit = useSubmit()
	return (
		<>
			<Aside gap="sm">
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button variant="destructive">拒否</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>教師承認</AlertDialogTitle>
							<AlertDialogDescription>
								購入を拒否しますか？
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>キャンセル</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => submit({ action: "reject" }, { method: "post" })}
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
							<AlertDialogTitle>教師承認</AlertDialogTitle>
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
		</>
	)
}
