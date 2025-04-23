import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import { Form } from "react-router"
import { z } from "zod"
import { MainContainer, Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { prisma } from "~/services/repository.server"
import { createErrorRedirect, createSuccessRedirect, requireSession } from "~/services/session.server"
import type { Route } from "./+types/create-form"

const NewWalletSchema = z.object({
	name: z.string().min(1),
	budget: z.number().min(0).max(1000000),
})

export default ({ actionData }: Route.ComponentProps) => {
	const [form, fields] = useForm({
		lastResult: actionData,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: NewWalletSchema })
		},
		shouldRevalidate: "onBlur",
		shouldValidate: "onInput",
	})
	return (
		<MainContainer>
			<Section>
				<SectionTitle>
					<Title>ウォレット作成</Title>
				</SectionTitle>
				<Form method="post" {...getFormProps(form)}>
					<div className="space-y-6">
						<div className="space-y-1">
							<Label htmlFor={fields.name.id}>ウォレット名</Label>
							<Input {...getInputProps(fields.name, { type: "text" })} />
							<div className="text-red-500 text-sm">{fields.name.errors?.join(", ")}</div>
						</div>
						<div className="space-y-1">
							<Label htmlFor={fields.budget.id}>予算</Label>
							<Input {...getInputProps(fields.budget, { type: "number" })} />
							<div className="text-red-500 text-sm">{fields.budget.errors?.join(", ")}</div>
						</div>
						<Button type="submit">作成</Button>
					</div>
				</Form>
			</Section>
		</MainContainer>
	)
}

export const action = async ({ request }: Route.ActionArgs) => {
	const result = parseWithZod(await request.formData(), { schema: NewWalletSchema })
	if (result.status !== "success") return result.reply()
	const { name, budget } = result.value
	const session = await requireSession(request)
	const errorRedirect = createErrorRedirect(session, "/app/admin/create-form")
	await prisma.wallet
		.create({
			data: {
				event: {
					connect: {
						id: "defa131b-142d-45a4-915f-5c1a59eb3e4e",
					},
				},
				name,
				budget,
			},
		})
		.catch(errorRedirect("ウォレットを作成できませんでした。").catch())
	const successRedirect = createSuccessRedirect(session, "/app/admin/wallets")
	return successRedirect("ウォレットを作成しました。")
}
