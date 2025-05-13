import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import { Form } from "react-router"
import { z } from "zod"
import { Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { FormBody, FormField } from "~/components/utility/form"
import { prisma } from "~/services/repository.server"
import {
	_createErrorRedirect,
	_createSuccessRedirect,
	requireSession,
	verifyAdmin,
} from "~/services/session.server"
import type { Route } from "./+types/wallet-create"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	await verifyAdmin(session)
	return null
}

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
		<Section>
			<SectionTitle>
				<Title>ウォレット作成</Title>
			</SectionTitle>
			<Form method="post" {...getFormProps(form)}>
				<FormBody>
					<FormField
						label="ウォレット名"
						name={fields.name.id}
						error={fields.name.errors}
					>
						<Input {...getInputProps(fields.name, { type: "text" })} />
					</FormField>
					<FormField
						label="予算"
						name={fields.budget.id}
						error={fields.budget.errors}
					>
						<Input {...getInputProps(fields.budget, { type: "number" })} />
					</FormField>
					<Button type="submit">作成</Button>
				</FormBody>
			</Form>
		</Section>
	)
}

export const action = async ({ request }: Route.ActionArgs) => {
	const result = parseWithZod(await request.formData(), {
		schema: NewWalletSchema,
	})
	if (result.status !== "success") return result.reply()
	const { name, budget } = result.value
	const session = await requireSession(request)
	const errorRedirect = _createErrorRedirect(
		session,
		"/app/admin/wallet/create",
	)
	await prisma.wallet
		.create({
			data: {
				event: {
					connect: {
						id: "nishikosai",
					},
				},
				name,
				budget,
			},
		})
		.catch(errorRedirect("ウォレットを作成できませんでした。").catch())
	const successRedirect = _createSuccessRedirect(session, "/app/admin/wallet")
	return successRedirect("ウォレットを作成しました。")
}
