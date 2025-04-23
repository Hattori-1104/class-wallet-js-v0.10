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
import { createErrorRedirect, createSuccessRedirect } from "~/services/session.server"
import { getSession } from "~/services/session.server"
import { verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/create-form"

export const loader = async ({ request, params: { walletId } }: Route.LoaderArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const errorRedirect = createErrorRedirect(session, "/app/student")
	const studentId = await verifyStudent(session)
	const wallet = await prisma.wallet
		.findUniqueOrThrow({
			where: {
				id: walletId,
				accountantStudents: {
					some: {
						id: studentId,
					},
				},
			},
			select: {
				id: true,
				name: true,
				budget: true,
			},
		})
		.catch(errorRedirect("ウォレットが見つかりません。").catch())
	return { wallet }
}

export default ({
	actionData,
	loaderData: {
		wallet: { budget },
	},
}: Route.ComponentProps) => {
	const NewPartSchema = z.object({
		name: z.string().min(1),
		budget: z.number().min(0).max(budget),
	})

	const [form, fields] = useForm({
		lastResult: actionData,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: NewPartSchema })
		},
		shouldRevalidate: "onBlur",
		shouldValidate: "onInput",
	})
	return (
		<MainContainer>
			<Section>
				<SectionTitle>
					<Title>パートを作成</Title>
				</SectionTitle>
			</Section>
			<Form method="POST" {...getFormProps(form)}>
				<div className="space-y-6">
					<div className="space-y-1">
						<Label htmlFor={fields.name.id}>パート名</Label>
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
		</MainContainer>
	)
}

export const action = async ({ request, params: { walletId } }: Route.ActionArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const errorRedirect = createErrorRedirect(session, "/app/student")
	const studentId = await verifyStudent(session)
	const wallet = await prisma.wallet
		.findUniqueOrThrow({
			where: {
				id: walletId,
				accountantStudents: {
					some: {
						id: studentId,
					},
				},
			},
			select: {
				id: true,
				name: true,
				budget: true,
			},
		})
		.catch(errorRedirect("ウォレットが見つかりません。").catch())
	const NewPartSchema = z.object({
		name: z.string().min(1),
		budget: z.number().min(0).max(wallet.budget),
	})
	const formData = await request.formData()
	const result = parseWithZod(formData, { schema: NewPartSchema })
	if (result.status !== "success") {
		return result.reply()
	}
	const { name, budget } = result.value
	await prisma.part
		.create({
			data: {
				name,
				budget,
				wallet: { connect: { id: walletId } },
			},
		})
		.catch(errorRedirect("パートの作成に失敗しました。").catch())
	const successRedirect = createSuccessRedirect(session, `/app/student/wallet/${walletId}`)
	return successRedirect("パートを作成しました。")
}
