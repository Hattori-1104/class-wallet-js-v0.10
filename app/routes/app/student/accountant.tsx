import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import type { Prisma } from "@prisma/client"
import { Link, Loader2, Send, Trash } from "lucide-react"
import { Form, useNavigation, useSubmit } from "react-router"
import { toast } from "sonner"
import { z } from "zod"
import { LayoutRelative, MainContainer, Section, SectionContent, SectionTitle } from "~/components/common/container"
import { HeaderBackButton } from "~/components/common/header"
import { Header } from "~/components/common/header"
import { Aside, Distant } from "~/components/common/placement"
import { NoData, Title } from "~/components/common/typography"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { FormBody, FormField, FormFooter } from "~/components/utility/form"
import { verifyStudent } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import { buildErrorRedirect, buildSuccessRedirect, requireSession } from "~/services/session.server"
import { formatCurrency } from "~/utilities/display"
import type { Route } from "./+types/accountant"

const WalletSelectQuery = {
	id: true,
	name: true,
	budget: true,
	parts: {
		select: {
			id: true,
			name: true,
			budget: true,
			isBazaar: true,
			_count: {
				select: {
					purchases: true,
				},
			},
		},
	},
} satisfies Prisma.WalletSelect

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	const errorRedirect = buildErrorRedirect("/app/student/part", session)

	const wallet = await prisma.wallet
		.findUniqueOrThrow({
			where: {
				id: params.walletId,
				accountantStudents: {
					some: {
						id: student.id,
					},
				},
			},
			select: WalletSelectQuery,
		})
		.catch(() => errorRedirect("指定されたウォレットが見つかりません。"))

	return {
		wallet,
	}
}

const formSchema = z.discriminatedUnion("intent", [
	z.object({
		intent: z.literal("create"),
		name: z.string().min(1),
		budget: z.number().min(0),
	}),
	z.object({
		intent: z.literal("update"),
		id: z.string(),
		budget: z.number().min(0),
	}),
	z.object({
		intent: z.literal("delete"),
		id: z.string(),
	}),
])

export default ({ loaderData: { wallet }, actionData }: Route.ComponentProps) => {
	const [form, fields] = useForm({
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: formSchema })
		},
		lastResult: actionData?.lastResult,
		shouldRevalidate: "onBlur",
		shouldValidate: "onInput",
	})
	const navigation = useNavigation()
	const wholePartBudgetWithoutBazaar = wallet.parts.reduce((acc, part) => acc + (part.isBazaar ? 0 : part.budget), 0)
	return (
		<>
			<LayoutRelative>
				<Header>
					<HeaderBackButton to="/app/student/part" />
				</Header>
				<MainContainer>
					<Section>
						<SectionTitle>
							<Title>{wallet.name} - 設定</Title>
						</SectionTitle>
					</Section>
					<SectionContent className="space-y-4">
						<SectionTitle>ウォレットの予算：{formatCurrency(wallet.budget)}</SectionTitle>
						<Form method="post" {...getFormProps(form)}>
							<Alert>
								<AlertTitle>
									<FormBody>
										<FormField label="パート名" name={fields.name.id} error={fields.name.errors}>
											<Input {...getInputProps(fields.name, { type: "text" })} />
										</FormField>
										<FormField label="予算" name={fields.budget.id} error={fields.budget.errors}>
											<Input className="text-right no-spin" {...getInputProps(fields.budget, { type: "number" })} />
										</FormField>
									</FormBody>
									<FormFooter>
										<Button type="submit" name="intent" value="create" disabled={navigation.state === "submitting"}>
											{navigation.state === "submitting" ? (
												<>
													<Loader2 className="animate-spin" />
													<span>作成中...</span>
												</>
											) : (
												<>
													<Send />
													<span>作成</span>
												</>
											)}
										</Button>
									</FormFooter>
								</AlertTitle>
							</Alert>
						</Form>
						{wallet.parts.length > 0 ? (
							wallet.parts.map((part) => (
								<PartItem
									key={part.id}
									id={part.id}
									name={part.name}
									budget={part.budget}
									isBazaar={part.isBazaar}
									purchasesCount={part._count.purchases}
								/>
							))
						) : (
							<NoData className="text-center block">パートがありません。</NoData>
						)}
						{wallet.budget > wholePartBudgetWithoutBazaar && (
							<Alert>
								<AlertTitle>予備費（余り予算）</AlertTitle>
								<AlertDescription>{formatCurrency(wallet.budget - wholePartBudgetWithoutBazaar)}</AlertDescription>
							</Alert>
						)}
					</SectionContent>
				</MainContainer>
			</LayoutRelative>
		</>
	)
}

type PartItemProps = {
	id: string
	name: string
	budget: number
	isBazaar: boolean
	purchasesCount: number
}
function PartItem(props: PartItemProps) {
	const submit = useSubmit()
	const navigation = useNavigation()
	const [form, fields] = useForm({
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: formSchema })
		},
		shouldRevalidate: "onBlur",
		shouldValidate: "onInput",
	})

	const copyInviteLink = async () => {
		try {
			const origin = window.location.origin
			const inviteUrl = `${origin}/app/invite/null/${props.id}`
			await navigator.clipboard.writeText(inviteUrl)
			toast.success(`${props.name}の招待リンクをコピーしました`, { position: "top-right" })
		} catch (_) {
			toast.error("リンクのコピーに失敗しました", { position: "top-right" })
		}
	}

	return (
		<Alert key={props.id}>
			<AlertTitle>
				<Distant>
					<span>{props.name}</span>
					<Aside>
						<Button
							variant="destructive"
							size="icon"
							disabled={props.purchasesCount > 0}
							onClick={() => submit({ intent: "delete", id: props.id }, { method: "post" })}
						>
							{navigation.state === "submitting" ? <Loader2 className="animate-spin" /> : <Trash />}
						</Button>
						<Button size="icon" onClick={copyInviteLink}>
							<Link />
						</Button>
					</Aside>
				</Distant>
			</AlertTitle>
			<AlertDescription>
				<Distant>
					<p>{formatCurrency(props.budget)}</p>
					<Form method="post" {...getFormProps(form)}>
						<Aside className="mt-2">
							<Input
								className="w-24 no-spin text-right"
								placeholder="予算変更"
								{...getInputProps(fields.budget, {
									type: "number",
								})}
							/>
							<input type="hidden" name="id" value={props.id} />
							<Button
								type="submit"
								name="intent"
								value="update"
								size="icon"
								disabled={navigation.state === "submitting"}
							>
								{navigation.state === "submitting" ? <Loader2 className="animate-spin" /> : <Send />}
							</Button>
						</Aside>
					</Form>
				</Distant>
			</AlertDescription>
		</Alert>
	)
}

export const action = async ({ request, params }: Route.ActionArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)

	const wallet = await prisma.wallet
		.findUniqueOrThrow({
			where: {
				id: params.walletId,
				accountantStudents: {
					some: {
						id: student.id,
					},
				},
			},
			select: {
				id: true,
				budget: true,
				parts: {
					select: {
						id: true,
						budget: true,
					},
				},
			},
		})
		.catch(() => buildErrorRedirect("/app/student/part", session)("指定されたウォレットが見つかりません。"))

	const errorRedirect = buildErrorRedirect(`/app/student/accountant/${wallet.id}`, session)

	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: formSchema })

	if (submission.status !== "success") return { lastResult: submission.reply() }
	const { value } = submission

	if (value.intent === "create") {
		if (wallet.parts.reduce((acc, part) => acc + part.budget, 0) + value.budget > wallet.budget) {
			return errorRedirect("予算を超えています。")
		}
		const part = await prisma.part
			.create({
				data: {
					name: value.name,
					budget: value.budget,
					wallet: {
						connect: {
							id: wallet.id,
						},
					},
				},
			})
			.catch(() => errorRedirect("パートの作成に失敗しました。"))
		const successRedirect = buildSuccessRedirect(`/app/student/accountant/${wallet.id}`, session)
		return successRedirect(`${part.name} を作成しました。`)
	}

	if (value.intent === "delete") {
		const part = await prisma.part
			.delete({
				where: { id: value.id },
			})
			.catch(() => errorRedirect("パートの削除に失敗しました。"))
		const successRedirect = buildSuccessRedirect(`/app/student/accountant/${wallet.id}`, session)
		return successRedirect(`${part.name} を削除しました。`)
	}

	if (value.intent === "update") {
		const totalBudget = wallet.parts.reduce((acc, part) => acc + (part.id === value.id ? value.budget : part.budget), 0)
		if (totalBudget > wallet.budget) {
			return errorRedirect("予算を超えています。")
		}
		const part = await prisma.part
			.update({
				where: { id: value.id },
				data: { budget: value.budget },
			})
			.catch(() => errorRedirect("パートの更新に失敗しました。"))
		const successRedirect = buildSuccessRedirect(`/app/student/accountant/${wallet.id}`, session)
		return successRedirect(`${part.name} の予算を変更しました。`)
	}
}
