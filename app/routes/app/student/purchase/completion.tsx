import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import { Loader2, Send } from "lucide-react"
import { Form, data, useNavigation, useRevalidator } from "react-router"
import { z } from "zod"
import { SectionContent, SectionTitle } from "~/components/common/container"
import { Section } from "~/components/common/container"
import { Distant } from "~/components/common/placement"
import { Title } from "~/components/common/typography"
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
import { prisma } from "~/services/repository.server"
import { entryStudentRoute } from "~/services/route-module.server"
import { commitSession, successBuilder } from "~/services/session.server"
import { formatCurrency, formatDiffDate } from "~/utilities/display"
import type { Route } from "./+types/completion"

const queryIsRequester = async (purchaseId: string, studentId: string) => {
	const purchase = await prisma.purchase.findUnique({
		where: {
			id: purchaseId,
			requestedBy: { id: studentId },
			part: { students: { some: { id: studentId } } },
		},
	})
	return Boolean(purchase)
}

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { partId, student } = await entryStudentRoute(request, params.partId)

	// TODO: エラーハンドリング
	const purchase = await prisma.purchase.findUniqueOrThrow({
		where: {
			id: params.purchaseId,
			part: { id: partId, students: { some: { id: student.id } } },
		},
		select: {
			canceled: true,
			label: true,
			plannedUsage: true,
			requestedBy: {
				select: {
					name: true,
				},
			},
			completion: {
				select: {
					actualUsage: true,
					at: true,
				},
			},
			receiptSubmission: {},
		},
	})
	const isRequester = await queryIsRequester(params.purchaseId, student.id)
	return { purchase, isRequester }
}

// TODO: バリデーションを追加
const formSchema = z.object({
	actualUsage: z.number().min(1),
	intent: z.enum(["confirm", "submit"]),
})

function RequesterPage({
	loaderData: { purchase },
	actionData,
}: Route.ComponentProps) {
	const [form, fields] = useForm({
		lastResult: null,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: formSchema })
		},
		shouldRevalidate: "onBlur",
		shouldValidate: "onInput",
	})
	const { revalidate } = useRevalidator()
	const navigation = useNavigation()
	return (
		<>
			<Section>
				<SectionTitle>
					<Title>購入</Title>
				</SectionTitle>
				<SectionContent>
					{purchase.completion ? (
						<CompletedAlertComponent
							actualUsage={purchase.completion.actualUsage}
							at={purchase.completion.at}
						/>
					) : (
						<Form method="post" {...getFormProps(form)}>
							<Alert>
								<AlertTitle className="space-y-2">
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
												disabled={
													actionData?.shouldConfirm ||
													navigation.state === "submitting"
												}
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
					)}
				</SectionContent>
			</Section>
			<AlertDialog
				open={!!actionData?.shouldConfirm}
				onOpenChange={(open) => {
					!open && revalidate()
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>使用金額の報告</AlertDialogTitle>
						<AlertDialogDescription>
							実際に使用した金額を税込みで入力してください。
						</AlertDialogDescription>
						<Alert>
							<AlertTitle>
								<Distant>
									<span>{purchase.label}</span>
									<span>
										{formatCurrency(Number(fields.actualUsage.value))}
									</span>
								</Distant>
							</AlertTitle>
						</Alert>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>キャンセル</AlertDialogCancel>
						<AlertDialogAction
							type="submit"
							name="intent"
							value="submit"
							disabled={navigation.state === "submitting"}
							form={form.id}
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
		</>
	)
}

function DefaultPage({ loaderData: { purchase } }: Route.ComponentProps) {
	return (
		<>
			<Section>
				<SectionTitle>
					<Title>購入</Title>
				</SectionTitle>
				<SectionContent>
					{purchase.completion ? (
						<CompletedAlertComponent
							actualUsage={purchase.completion.actualUsage}
							at={purchase.completion.at}
						/>
					) : (
						<Alert>
							<AlertTitle>
								<span>{purchase.requestedBy.name} さんが買い出し中です。</span>
							</AlertTitle>
						</Alert>
					)}
				</SectionContent>
			</Section>
		</>
	)
}

function CompletedAlertComponent({
	actualUsage,
	at,
}: { actualUsage: number; at: Date }) {
	return (
		<Alert className="border-positive/50 text-positive">
			<AlertTitle>
				<span>{formatCurrency(actualUsage)} で購入しました。</span>
			</AlertTitle>
			<AlertDescription>{formatDiffDate(at)}</AlertDescription>
		</Alert>
	)
}

export default (props: Route.ComponentProps) => {
	if (props.loaderData.isRequester) return <RequesterPage {...props} />
	return <DefaultPage {...props} />
}

export const action = async ({ request, params }: Route.ActionArgs) => {
	const { partId, student, session } = await entryStudentRoute(
		request,
		params.partId,
	)

	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: formSchema })

	if (submission.status !== "success") {
		session.flash("error", { message: "入力に誤りがあります。" })
		return data(
			{ result: submission.reply(), shouldConfirm: false },
			{
				headers: { "Set-Cookie": await commitSession(session) },
			},
		)
	}

	const { value } = submission
	if (value.intent === "confirm")
		return { result: submission.reply(), shouldConfirm: true }

	try {
		const purchase = await prisma.purchase.update({
			where: {
				id: params.purchaseId,
				part: { id: partId, students: { some: { id: student.id } } },
			},
			data: {
				completion: {
					upsert: {
						update: {
							actualUsage: value.actualUsage,
						},
						create: {
							actualUsage: value.actualUsage,
						},
					},
				},
			},
		})
		const successRedirect = successBuilder(
			`/app/student/part/${partId}/purchase/${purchase.id}`,
			session,
		)

		return await successRedirect(
			`買い出しの完了を報告しました：${purchase.label}`,
		)
	} catch (error) {
		// biome-ignore lint/suspicious/noConsole: エラーをログに出力
		console.error(error)
		session.flash("error", { message: "購入の更新に失敗しました。" })
		return data(
			{ result: submission.reply(), shouldConfirm: false },
			{
				headers: { "Set-Cookie": await commitSession(session) },
			},
		)
	}
}
