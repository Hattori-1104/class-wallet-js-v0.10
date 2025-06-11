import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import type { Prisma } from "@prisma/client"
import { Check, Loader2, Send, ShoppingCart } from "lucide-react"
import { Form, useNavigation, useRevalidator } from "react-router"
import { z } from "zod"
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
} from "~/components/ui/alert-dialog"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { FormField } from "~/components/utility/form"
import { formatCurrency, formatDiffDate } from "~/utilities/display"
import type { PurchaseCompletionSelectQuery } from "./completion.server"

type PurchaseCompletionSectionContentProps = {
	purchase: Prisma.PurchaseGetPayload<{
		select: PurchaseCompletionSelectQuery
	}>
	userType: "student" | "teacher"
} & (
	| {
			isRequester: true
			shouldConfirm: boolean
	  }
	| { isRequester: false }
)

export function PurchaseCompletionSectionContent(
	props: PurchaseCompletionSectionContentProps,
) {
	return (
		<>
			<SectionContent>
				{props.purchase.completion ? (
					<CompletedAlertComponent
						actualUsage={props.purchase.completion.actualUsage}
						at={props.purchase.completion.at}
					/>
				) : props.isRequester ? (
					<CanCompleteAlertComponent shouldConfirm={props.shouldConfirm} />
				) : (
					<IncompleteAlertComponent
						requestedByName={props.purchase.requestedBy.name}
					/>
				)}
			</SectionContent>
		</>
	)
}

function CompletedAlertComponent({
	actualUsage,
	at,
}: {
	actualUsage: number
	at: Date
}) {
	return (
		<Alert variant="positive">
			<Check className="size-4" />
			<AlertTitle>
				<Distant>
					<span>買い出し完了</span>
					<span>使用金額: {formatCurrency(actualUsage)}</span>
				</Distant>
			</AlertTitle>
			<AlertDescription>
				<span>{formatDiffDate(at)}</span>
			</AlertDescription>
		</Alert>
	)
}

function IncompleteAlertComponent({
	requestedByName,
}: { requestedByName: string }) {
	return (
		<Alert>
			<ShoppingCart className="size-4" />
			<AlertTitle>
				<span>{requestedByName} さんが買い出し中です。</span>
			</AlertTitle>
		</Alert>
	)
}

// TODO: バリデーションを追加
export const formSchema = z.object({
	actualUsage: z.number().min(1),
	intent: z.enum(["confirm", "submit"]),
})

type PurchaseCompletionConfirmDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	actualUsage: number
	formId: string
}

function PurchaseCompletionConfirmDialog({
	open,
	onOpenChange,
	actualUsage,
	formId,
}: PurchaseCompletionConfirmDialogProps) {
	const navigation = useNavigation()
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>使用金額の報告</AlertDialogTitle>
					<AlertDialogDescription>
						入力を確認してください。
					</AlertDialogDescription>
					<Alert>
						<AlertTitle>
							<Distant>
								<span>買い出し完了</span>
								<span>{formatCurrency(actualUsage)}</span>
							</Distant>
						</AlertTitle>
					</Alert>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>キャンセル</AlertDialogCancel>
					<AlertDialogAction
						type="submit"
						form={formId}
						name="intent"
						value="submit"
						disabled={navigation.state === "submitting"}
					>
						{navigation.state === "submitting" ? (
							<>
								<Loader2 className="animate-spin" />
								<span>送信中...</span>
							</>
						) : (
							<>
								<Send />
								<span>報告</span>
							</>
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

function CanCompleteAlertComponent({
	shouldConfirm,
}: {
	shouldConfirm: boolean
}) {
	const { revalidate } = useRevalidator()
	const navigation = useNavigation()
	const [form, fields] = useForm({
		lastResult: null,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: formSchema })
		},
		shouldRevalidate: "onBlur",
		shouldValidate: "onInput",
	})

	return (
		<>
			<Form method="post" {...getFormProps(form)}>
				<Alert>
					<ShoppingCart className="size-4" />
					<AlertTitle className="space-y-2">
						<div>買い出しに行ってください。</div>
						<FormField
							label="使用金額の報告"
							name={fields.actualUsage.id}
							error={fields.actualUsage.errors}
						>
							<div className="w-full grid grid-cols-[1fr_auto] gap-2">
								<Input
									className="text-right no-spin"
									{...getInputProps(fields.actualUsage, {
										type: "number",
									})}
								/>
								<Button
									type="submit"
									name="intent"
									value="confirm"
									disabled={shouldConfirm || navigation.state === "submitting"}
								>
									{navigation.state === "submitting" ? (
										<>
											<Loader2 className="animate-spin" />
											<span>検証中...</span>
										</>
									) : (
										<>
											<Send />
											<span>報告</span>
										</>
									)}
								</Button>
							</div>
						</FormField>
					</AlertTitle>
				</Alert>
			</Form>
			<PurchaseCompletionConfirmDialog
				open={shouldConfirm}
				onOpenChange={(open) => !open && revalidate()}
				actualUsage={Number(fields.actualUsage.value) || 0}
				formId={form.id}
			/>
		</>
	)
}
