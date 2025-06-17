import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import { Link, Loader2, Send, Trash } from "lucide-react"
import { Form, useNavigation, useSubmit } from "react-router"
import { toast } from "sonner"
import { z } from "zod"
import { SectionContent, SectionTitle } from "~/components/common/container"
import { Section } from "~/components/common/container"
import { Aside, Distant } from "~/components/common/placement"
import { Title } from "~/components/common/typography"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { FormBody, FormField, FormFooter } from "~/components/utility/form"
import { entryAdminRoute } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import { buildErrorRedirect, buildSuccessRedirect } from "~/services/session.server"
import { formatCurrency } from "~/utilities/display"
import type { Route } from "./+types/index"
export const loader = async ({ request }: Route.LoaderArgs) => {
	await entryAdminRoute(request)

	const wallets = await prisma.wallet.findMany({
		select: {
			id: true,
			name: true,
			budget: true,
		},
	})

	return { wallets }
}

const formSchema = z.discriminatedUnion("intent", [
	z.object({
		intent: z.literal("create"),
		name: z.string().min(1),
		budget: z.number().min(0),
	}),
	z.object({
		intent: z.literal("delete"),
		id: z.string(),
	}),
])

export default ({ loaderData: { wallets }, actionData }: Route.ComponentProps) => {
	const [form, fields] = useForm({
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: formSchema })
		},
		lastResult: actionData,
		shouldRevalidate: "onBlur",
		shouldValidate: "onInput",
	})

	const navigation = useNavigation()
	const submit = useSubmit()

	const copyInviteLink = async (walletId: string, walletName: string) => {
		try {
			const origin = window.location.origin
			const inviteUrl = `${origin}/app/invite/${walletId}`
			await navigator.clipboard.writeText(inviteUrl)
			toast.success(`${walletName}の招待リンクをコピーしました`, { position: "top-right" })
		} catch (_) {
			toast.error("リンクのコピーに失敗しました", { position: "top-right" })
		}
	}

	return (
		<Section>
			<SectionTitle>
				<Title>ウォレット作成</Title>
			</SectionTitle>
			<SectionContent className="space-y-4">
				<Form method="post" {...getFormProps(form)}>
					<Alert>
						<AlertTitle>
							<FormBody>
								<FormField label="ウォレット名" name={fields.name.id} error={fields.name.errors}>
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
				{wallets.map((wallet) => (
					<Alert key={wallet.id}>
						<AlertTitle>
							<Distant>
								<span>{wallet.name}</span>
								<Aside>
									<Button
										// disabled={navigation.state === "submitting"}
										disabled={true}
										onClick={() => {
											submit({ intent: "delete", id: wallet.id }, { method: "post" })
										}}
										size="icon"
										variant="destructive"
									>
										{navigation.state === "submitting" ? <Loader2 className="animate-spin" /> : <Trash />}
									</Button>
									<Button size="icon" onClick={() => copyInviteLink(wallet.id, wallet.name)}>
										<Link />
									</Button>
								</Aside>
							</Distant>
						</AlertTitle>
						<AlertDescription>{formatCurrency(wallet.budget)}</AlertDescription>
					</Alert>
				))}
			</SectionContent>
		</Section>
	)
}

export const action = async ({ request }: Route.ActionArgs) => {
	const { session } = await entryAdminRoute(request)
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: formSchema })

	if (submission.status !== "success") {
		return submission.reply()
	}

	const errorRedirect = buildErrorRedirect("/app/admin", session)
	if (submission.value.intent === "create") {
		const wallet = await prisma.wallet
			.create({
				data: {
					name: submission.value.name,
					budget: submission.value.budget,
					event: {
						connect: {
							id: "nishikosai2025",
						},
					},
				},
				select: {
					id: true,
					name: true,
				},
			})
			.catch(() => errorRedirect("ウォレット作成に失敗しました。"))
		const successRedirect = buildSuccessRedirect("/app/admin", session)
		return successRedirect(`${wallet.name} を作成しました。`)
	}
	if (submission.value.intent === "delete") {
		const wallet = await prisma.wallet
			.delete({
				where: {
					id: submission.value.id,
				},
			})
			.catch(() => errorRedirect("ウォレット削除に失敗しました。"))
		const successRedirect = buildSuccessRedirect("/app/admin", session)
		return successRedirect(`${wallet.name} を削除しました。`)
	}
}
