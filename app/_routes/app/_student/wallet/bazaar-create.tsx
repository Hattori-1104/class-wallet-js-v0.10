import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import { Form } from "react-router"
import { z } from "zod"
import { SectionTitle } from "~/components/common/container"
import { Section } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { FormField } from "~/components/utility/form"
import { FormBody } from "~/components/utility/form"
import { prisma } from "~/services/repository.server"
import { verifyStudent } from "~/services/route-module.server"
import {
	_createErrorRedirect,
	_createSuccessRedirect,
} from "~/services/session.server"
import { requireSession } from "~/services/session.server"
import type { Route } from "./+types/bazaar-create"

const NewBazaarSchema = z.object({
	budget: z.number().min(0),
})

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	await verifyStudent(session)
	return null
}

export default ({ actionData }: Route.ComponentProps) => {
	const [form, fields] = useForm({
		lastResult: actionData,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: NewBazaarSchema })
		},
		shouldRevalidate: "onBlur",
		shouldValidate: "onInput",
	})
	return (
		<Section>
			<SectionTitle>
				<Title>バザー仕入れ専用パート作成</Title>
			</SectionTitle>
			<Form method="post" {...getFormProps(form)}>
				<FormBody>
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

export const action = async ({
	request,
	params: { walletId },
}: Route.ActionArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	const errorRedirect = _createErrorRedirect(
		session,
		`/app/student/wallet/${walletId}`,
	)
	const result = parseWithZod(await request.formData(), {
		schema: NewBazaarSchema,
	})
	if (result.status !== "success") return result.reply()
	const { budget } = result.value
	await prisma.wallet
		.update({
			where: {
				id: walletId,
				accountantStudents: {
					some: {
						id: student.id,
					},
				},
			},
			data: {
				parts: {
					create: {
						name: "バザー仕入れ専用パート",
						budget,
						leaders: {
							connect: {
								id: student.id,
							},
						},
						students: {
							connect: {
								id: student.id,
							},
						},
						isBazaar: true,
					},
				},
			},
		})
		.catch(errorRedirect("パートを作成できませんでした。").catch())
	const successRedirect = _createSuccessRedirect(
		session,
		`/app/student/wallet/${walletId}`,
	)
	return successRedirect("バザー専用パートを作成しました。")
}
