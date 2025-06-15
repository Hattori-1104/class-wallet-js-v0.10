import {
	getFormProps,
	getInputProps,
	getTextareaProps,
	useForm,
} from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import { Loader2, Send } from "lucide-react"
import { Form, data, useNavigation, useRevalidator } from "react-router"
import { z } from "zod"
import {
	Section,
	SectionContent,
	SectionTitle,
} from "~/components/common/container"
import { AsideEven, Distant } from "~/components/common/placement"
import { Title } from "~/components/common/typography"
import { Alert, AlertTitle } from "~/components/ui/alert"
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
import { Textarea } from "~/components/ui/textarea"
import { FormBody, FormField, FormFooter } from "~/components/utility/form"
import { entryStudentRoute } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import { buildSuccessRedirect, commitSession } from "~/services/session.server"
import { formatCurrency } from "~/utilities/display"
import type { Route } from "./+types/new"

// TODO: 最終的には予定金額をオプショナルに（AI生成）
// TODO: スキーマを厳密に（エラーメッセージ、データ長）
const formSchema = z.object({
	label: z.string(),
	description: z.string().optional(),
	plannedUsage: z.number(),
	intent: z.enum(["confirm", "submit"]),
})

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	await entryStudentRoute(request, params.partId)
	return null
}

export default ({ actionData }: Route.ComponentProps) => {
	const [form, fields] = useForm({
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: formSchema })
		},
		onSubmit(_, { formData }) {
			return parseWithZod(formData, { schema: formSchema })
		},
		shouldValidate: "onBlur",
		shouldRevalidate: "onInput",
	})

	const navigation = useNavigation()
	const { revalidate } = useRevalidator()
	return (
		<>
			<Section>
				<SectionTitle>
					<Title>買い出しをリクエスト</Title>
				</SectionTitle>
				<SectionContent>
					<Form method="post" {...getFormProps(form)}>
						<FormBody>
							<FormField
								label="買いたいもの"
								name={fields.label.id}
								error={fields.label.errors}
							>
								<Input {...getInputProps(fields.label, { type: "text" })} />
							</FormField>
							<FormField
								label="備考"
								name={fields.description.id}
								error={fields.description.errors}
							>
								<Textarea {...getTextareaProps(fields.description)} />
							</FormField>
							<FormField
								label="使用予定金額"
								name={fields.plannedUsage.id}
								error={fields.plannedUsage.errors}
							>
								<Input
									{...getInputProps(fields.plannedUsage, { type: "number" })}
									className="text-right no-spin"
								/>
							</FormField>
						</FormBody>
						<FormFooter>
							<Button
								type="submit"
								name="intent"
								value="confirm"
								disabled={
									actionData?.shouldConfirm || navigation.state === "submitting"
								}
								className="w-full sm:max-w-48"
							>
								{navigation.state === "submitting" ? (
									<>
										<Loader2 className="animate-spin" />
										<span>検証中...</span>
									</>
								) : (
									<>
										<Send />
										<span>リクエストを送信</span>
									</>
								)}
							</Button>
						</FormFooter>
					</Form>
					<AlertDialog
						open={!!actionData?.shouldConfirm}
						onOpenChange={(open) => {
							// キャンセルボタンや ESC キー押下時に閉じられるので、
							// revalidate で再度 loader を実行し、
							// lastResult をリセットして初期状態に戻す。
							// フォームの値は Input の DOM に保持されているので
							// revalidate しても消えない。
							!open && revalidate()
						}}
					>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>リクエストの確認</AlertDialogTitle>
								<AlertDialogDescription className="[&>span]:inline-block">
									<span>以下の内容でリクエストを送信します。</span>
									<span>よろしいですか？</span>
								</AlertDialogDescription>
							</AlertDialogHeader>
							<Alert>
								<AlertTitle>
									<Distant>
										<span>{fields.label.value}</span>
										<span>
											{formatCurrency(Number(fields.plannedUsage.value))}
										</span>
									</Distant>
								</AlertTitle>
							</Alert>
							<AlertDialogFooter>
								<AsideEven className="w-full">
									<AlertDialogCancel className="grow">
										キャンセル
									</AlertDialogCancel>
									<AlertDialogAction
										type="submit"
										name="intent"
										value="submit"
										disabled={navigation.state === "submitting"}
										form={form.id}
										className="grow"
									>
										{navigation.state === "submitting" ? (
											<>
												<Loader2 className="animate-spin" />
												<span>送信中...</span>
											</>
										) : (
											<>
												<Send />
												<span>送信</span>
											</>
										)}
									</AlertDialogAction>
								</AsideEven>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</SectionContent>
			</Section>
		</>
	)
}

export const action = async ({ request, params }: Route.ActionArgs) => {
	// 認証
	const { partId, student, session } = await entryStudentRoute(
		request,
		params.partId,
	)
	// フォームデータの取得
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: formSchema })
	if (submission.status !== "success") {
		session.flash("error", { message: "入力に誤りがあります。" })
		return data(
			{ result: submission.reply(), shouldConfirm: false },
			{
				headers: {
					"Set-Cookie": await commitSession(session),
				},
			},
		)
	}
	// 確認ダイアログを表示
	if (submission.value.intent === "confirm")
		return { result: submission.reply(), shouldConfirm: true }

	// 情報の更新
	try {
		const { label, description, plannedUsage } = submission.value
		const purchase = await prisma.purchase.create({
			data: {
				label,
				description,
				plannedUsage,
				part: {
					connect: {
						id: partId,
					},
				},
				requestedBy: {
					connect: {
						id: student.id,
					},
				},
			},
			select: {
				id: true,
				label: true,
				plannedUsage: true,
			},
		})
		const successRedirect = buildSuccessRedirect(
			`/app/student/part/${partId}`,
			session,
		)

		return await successRedirect(
			`買い出しをリクエストしました：${purchase.label}`,
		)
	} catch (error) {
		// biome-ignore lint/suspicious/noConsole: エラーをログに出力
		console.error(error)
		session.flash("error", { message: "購入の作成に失敗しました。" })
		return data(
			{ result: submission.reply(), shouldConfirm: false },
			{ headers: { "Set-Cookie": await commitSession(session) } },
		)
	}
}
