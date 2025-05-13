import {
	getFormProps,
	getInputProps,
	getTextareaProps,
	useForm,
} from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import { Form } from "react-router"
import { z } from "zod"
import {
	Section,
	SectionContent,
	SectionTitle,
} from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { FormBody, FormField, FormFooter } from "~/components/utility/form"
import { entryPartRoute } from "~/services/route-module.server"
import type { Route } from "./+types/new-request"

// TODO: 最終的には予定金額をオプショナルに（AI生成）
// TODO: スキーマを厳密に（エラーメッセージ、データ長）
const formSchema = z.object({
	label: z.string(),
	description: z.string().optional(),
	plannedUsage: z.number(),
})

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	await entryPartRoute(request, params.partId)
	return null
}

export default ({ actionData }: Route.ComponentProps) => {
	const [form, fields] = useForm({
		lastResult: actionData,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: formSchema })
		},
		onSubmit(_, { formData }) {
			return parseWithZod(formData, { schema: formSchema })
		},
		shouldValidate: "onBlur",
		shouldRevalidate: "onInput",
	})
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
								label="買い出し概要"
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
								/>
							</FormField>
						</FormBody>
						<FormFooter>
							<Button type="submit">リクエスト</Button>
						</FormFooter>
					</Form>
				</SectionContent>
			</Section>
		</>
	)
}

export const action = async ({ request, params }: Route.ActionArgs) => {
	const { partId } = await entryPartRoute(request, params.partId)
	const formData = await request.formData()
	const result = parseWithZod(formData, { schema: formSchema })
	if (result.status !== "success") return result.reply()
	const { value } = result
	console.log(value)
	return null
}
