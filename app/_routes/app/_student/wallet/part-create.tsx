import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import { Form } from "react-router"
import { z } from "zod"
import { Section, SectionTitle } from "~/components/common/container"
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
	requireSession,
} from "~/services/session.server"
import type { Route } from "./+types/part-create"

const NewPartSchemaBuilder = (budget: number) =>
	z.object({
		name: z.string().min(1),
		budget: z.number().min(0).max(budget),
	})

export const loader = async ({
	request,
	params: { walletId },
}: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	const errorRedirect = _createErrorRedirect(
		session,
		`/app/student/wallet/${walletId}`,
	)
	const wallet = await prisma.wallet
		.findUniqueOrThrow({
			where: {
				id: walletId,
				accountantStudents: {
					some: {
						id: student.id,
					},
				},
			},
			select: {
				budget: true,
			},
		})
		.catch(errorRedirect("ウォレットが見つかりません。").catch())
	return { wallet }
}

export default ({
	actionData,
	loaderData: { wallet },
}: Route.ComponentProps) => {
	const [form, fields] = useForm({
		lastResult: actionData,
		onValidate({ formData }) {
			return parseWithZod(formData, {
				schema: NewPartSchemaBuilder(wallet.budget),
			})
		},
		shouldRevalidate: "onBlur",
		shouldValidate: "onInput",
	})
	return (
		<Section>
			<SectionTitle>
				<Title>パート作成</Title>
			</SectionTitle>
			<Form method="post" {...getFormProps(form)}>
				<FormBody>
					<FormField
						label="パート名"
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
	const wallet = await prisma.wallet
		.findUniqueOrThrow({
			where: {
				id: walletId,
				accountantStudents: {
					some: {
						id: student.id,
					},
				},
			},
		})
		.catch(errorRedirect("ウォレットが見つかりません。").catch())
	const result = parseWithZod(await request.formData(), {
		schema: NewPartSchemaBuilder(wallet.budget),
	})
	if (result.status !== "success") return result.reply()
	const { name, budget } = result.value
	await prisma.part
		.create({
			data: {
				name,
				budget,
				wallet: { connect: { id: walletId } },
			},
		})
		.catch(errorRedirect("パートを作成できませんでした。").catch())
	const successRedirect = _createSuccessRedirect(
		session,
		`/app/student/wallet/${walletId}`,
	)
	return successRedirect("パートを作成しました。")
}
