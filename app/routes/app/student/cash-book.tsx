import { type SubmissionResult, getFormProps, getInputProps, useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import { Loader2, Pencil, Plus, TriangleAlert } from "lucide-react"
import { type FC, memo, useEffect, useState } from "react"
import { Form, data, useNavigation } from "react-router"
import z from "zod"
import { Section, SectionContent, SectionTitle } from "~/components/common/container"
import { AsideEven } from "~/components/common/placement"
import { Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { FormBody, FormField } from "~/components/utility/form"
import {
	CashBookTable,
	type PurchaseRecordable,
	PurchaseRecordableOrderByQuery,
	PurchaseRecordableSelectQuery,
	PurchaseRecordableWhereQuery,
} from "~/route-modules/cash-book"
import { entryStudentWallet } from "~/route-modules/entry.server"
import { createUnknownUser, prisma } from "~/services/repository.server"
import { buildErrorRedirect, commitSession } from "~/services/session.server"
import type { Route } from "./+types/cash-book"

const formSchema = z.discriminatedUnion("intent", [
	z.object({
		intent: z.literal("add"),
		receiptIndex: z.number().min(1),
		label: z.string(),
		actualUsage: z.number().min(0),
		partId: z.string(),
	}),
	z.object({
		intent: z.literal("update"),
		purchaseId: z.string(),
		receiptIndex: z.number().min(1),
		actualUsage: z.number().min(0),
		partId: z.string(),
	}),
])

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { session, student, walletId } = await entryStudentWallet(request, params.partId)

	const errorRedirect = buildErrorRedirect("/app/student", session)

	const filteredPurchases = await prisma.purchase.findMany({
		where: { AND: [{ part: { wallet: { id: walletId } } }, PurchaseRecordableWhereQuery] },
		select: PurchaseRecordableSelectQuery,
		orderBy: PurchaseRecordableOrderByQuery,
	})
	const wallet = await prisma.wallet
		.findUniqueOrThrow({
			where: { id: walletId },
			select: {
				name: true,
				budget: true,
				parts: { select: { id: true, name: true, budget: true } },
				accountantStudents: { select: { id: true }, where: { id: student.id } },
			},
		})
		.catch(() => errorRedirect("ウォレットが見つかりません。"))
	const isAccountant = wallet.accountantStudents.length > 0
	return { filteredPurchases, wallet, isAccountant }
}

const AddPurchaseFormSectionContent: FC<{
	parts: { id: string; name: string }[]
	lastResult?: SubmissionResult<string[]>
}> = ({ parts, lastResult }) => {
	const [form, fields] = useForm({
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: formSchema })
		},
		lastResult,
		shouldRevalidate: "onBlur",
		shouldValidate: "onInput",
	})
	const navigation = useNavigation()
	const [open, setOpen] = useState(false)
	useEffect(() => {
		if (navigation.state === "idle") setOpen(false)
	}, [navigation.state])
	return (
		<SectionContent>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button variant="outline">
						<TriangleAlert />
						<span>出納簿の内容を入力</span>
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>出納簿の内容を入力</DialogTitle>
						<DialogDescription>記録されていない購入データの入力</DialogDescription>
					</DialogHeader>
					<Form method="post" {...getFormProps(form)}>
						<FormBody>
							<FormField label="レシート番号" name={fields.receiptIndex.id} error={fields.receiptIndex.errors}>
								<Input className="no-spin text-right" {...getInputProps(fields.receiptIndex, { type: "number" })} />
							</FormField>
							<FormField label="項目名" name={fields.label.id} error={fields.label.errors}>
								<Input {...getInputProps(fields.label, { type: "text" })} />
							</FormField>
							<FormField label="使用額" name={fields.actualUsage.id} error={fields.actualUsage.errors}>
								<Input className="no-spin text-right" {...getInputProps(fields.actualUsage, { type: "number" })} />
							</FormField>
							<FormField name={fields.partId.id} error={fields.partId.errors}>
								<Select
									name={fields.partId.name}
									onValueChange={(value) => form.update({ name: fields.partId.name, value })}
								>
									<SelectTrigger id={fields.partId.id}>
										<SelectValue placeholder="パートを選択してください" />
									</SelectTrigger>
									<SelectContent>
										{parts.map((part) => (
											<SelectItem key={part.id} value={part.id}>
												{part.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormField>
						</FormBody>
					</Form>
					<DialogFooter>
						<AsideEven>
							<DialogClose asChild>
								<Button variant="outline">キャンセル</Button>
							</DialogClose>
							<Button
								type="submit"
								name="intent"
								value="add"
								form={form.id}
								disabled={navigation.state === "submitting"}
							>
								{navigation.state === "submitting" ? <Loader2 className="animate-spin" /> : <Plus />}
								作成
							</Button>
						</AsideEven>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</SectionContent>
	)
}

export default ({ loaderData: { filteredPurchases, wallet, isAccountant }, actionData }: Route.ComponentProps) => {
	const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
	const [updatePurchaseId, setUpdatePurchaseId] = useState<string | null>(null)

	const updatePurchase = filteredPurchases.find((filteredPurchase) => filteredPurchase.id === updatePurchaseId)

	const navigation = useNavigation()
	useEffect(() => {
		if (navigation.state === "idle") setUpdateDialogOpen(false)
	}, [navigation.state])

	const UpdatePurchaseFormDialogContent = memo(({ purchase }: { purchase: PurchaseRecordable }) => {
		const [form, fields] = useForm({
			onValidate({ formData }) {
				return parseWithZod(formData, { schema: formSchema })
			},
			defaultValue: {
				receiptIndex: purchase.receiptSubmission?.receiptIndex,
				actualUsage: purchase.completion?.actualUsage,
				partId: purchase.partId,
				purchaseId: purchase.id,
			},
			shouldRevalidate: "onBlur",
			shouldValidate: "onInput",
		})
		return (
			<Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>出納簿の内容を変更</DialogTitle>
						<DialogDescription>既に記録されている購入データの編集</DialogDescription>
					</DialogHeader>
					<Form method="post" {...getFormProps(form)}>
						<input type="hidden" name="purchaseId" value={purchase.id} />
						<FormBody>
							<FormField label="レシート番号" name={fields.receiptIndex.id} error={fields.receiptIndex.errors}>
								<Input className="no-spin text-right" {...getInputProps(fields.receiptIndex, { type: "number" })} />
							</FormField>
							<FormField label="使用額" name={fields.actualUsage.id} error={fields.actualUsage.errors}>
								<Input className="no-spin text-right" {...getInputProps(fields.actualUsage, { type: "number" })} />
							</FormField>
							<FormField name={fields.partId.id} error={fields.partId.errors}>
								<Select
									name={fields.partId.name}
									onValueChange={(value) => form.update({ name: fields.partId.name, value })}
									defaultValue={purchase.partId}
								>
									<SelectTrigger id={fields.partId.id}>
										<SelectValue placeholder="パートを選択してください" />
									</SelectTrigger>
									<SelectContent>
										{wallet.parts.map((part) => (
											<SelectItem key={part.id} value={part.id}>
												{part.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormField>
						</FormBody>
					</Form>
					<DialogFooter>
						<AsideEven>
							<DialogClose asChild>
								<Button variant="outline">キャンセル</Button>
							</DialogClose>
							<Button
								type="submit"
								name="intent"
								value="update"
								form={form.id}
								disabled={navigation.state === "submitting" || !form.dirty}
							>
								{navigation.state === "submitting" ? <Loader2 className="animate-spin" /> : <Pencil />}
								変更
							</Button>
						</AsideEven>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		)
	})

	return (
		<>
			<Section>
				<SectionTitle>
					<Title>出納簿</Title>
				</SectionTitle>
				<SectionContent>
					<div className="border rounded-md overflow-auto max-h-[70vh]">
						<CashBookTable
							filteredPurchases={filteredPurchases}
							budget={wallet.budget}
							reserved={0}
							onEdit={(purchaseId) => {
								setUpdateDialogOpen(true)
								setUpdatePurchaseId(purchaseId)
							}}
						/>
					</div>
				</SectionContent>
				{isAccountant && <AddPurchaseFormSectionContent parts={wallet.parts} lastResult={actionData?.lastResult} />}
				{updatePurchase && <UpdatePurchaseFormDialogContent purchase={updatePurchase} />}
			</Section>
		</>
	)
}

export const action = async ({ request, params }: Route.ActionArgs) => {
	const { session, partId } = await entryStudentWallet(request, params.partId)

	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: formSchema })
	if (submission.status !== "success") return { lastResult: submission.reply() }

	const errorRedirect = buildErrorRedirect(`/app/student/${partId}`, session)

	await createUnknownUser()
	if (submission.value.intent === "add") {
		await prisma.purchase
			.create({
				data: {
					label: submission.value.label,
					plannedUsage: submission.value.actualUsage,
					requestedBy: {
						connect: {
							id: "unknown",
						},
					},
					part: {
						connect: {
							id: submission.value.partId,
						},
					},
					accountantApproval: {
						create: {
							approved: true,
							by: {
								connect: {
									id: "unknown",
								},
							},
						},
					},
					teacherApproval: {
						create: {
							approved: true,
							by: {
								connect: {
									id: "unknown",
								},
							},
						},
					},
					completion: {
						create: {
							actualUsage: submission.value.actualUsage,
						},
					},
					receiptSubmission: {
						create: {
							receiptIndex: submission.value.receiptIndex,
							submittedTo: {
								connect: {
									id: "unknown",
								},
							},
						},
					},
				},
			})
			.catch(() => errorRedirect("購入の作成に失敗しました。"))
		session.flash("success", { message: "購入の作成に成功しました。" })
		return data(null, { headers: { "Set-Cookie": await commitSession(session) } })
	}
	if (submission.value.intent === "update") {
		await prisma.purchase
			.update({
				where: { id: submission.value.purchaseId },
				data: {
					receiptSubmission: { update: { receiptIndex: submission.value.receiptIndex } },
					completion: { update: { actualUsage: submission.value.actualUsage } },
					part: { connect: { id: submission.value.partId } },
				},
			})
			.catch(() => errorRedirect("購入の更新に失敗しました。"))
		session.flash("success", { message: "購入の更新に成功しました。" })
		return data(null, { headers: { "Set-Cookie": await commitSession(session) } })
	}
}
