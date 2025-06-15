import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import { useState } from "react"
import { Form, useSubmit } from "react-router"
import { z } from "zod"
import { Section, SectionContent, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { Command, CommandGroup, CommandItem, CommandList } from "~/components/ui/command"
import { Input } from "~/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { FormBody, FormField, FormFooter } from "~/components/utility/form"
import {
	CashBookFilter,
	CashBookTable,
	PurchaseRecordableOrderByQuery,
	PurchaseRecordableSelectQuery,
	PurchaseRecordableWhereQuery,
} from "~/route-modules/cash-book"
import { entryStudentRoute } from "~/route-modules/common.server"
import { queryIsStudentInCharge } from "~/route-modules/purchase-state/common.server"
import { prisma } from "~/services/repository.server"
import { buildErrorRedirect } from "~/services/session.server"
import type { Route } from "./+types/cash-book"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { partId, student } = await entryStudentRoute(request, params.partId)

	// ウォレット情報とパーツ情報を同時に取得
	const wallet = await prisma.wallet.findFirst({
		where: {
			parts: {
				some: {
					id: partId,
				},
			},
		},
		select: {
			id: true,
			name: true,
			parts: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	})

	const url = new URL(request.url)
	const searchParams = new URLSearchParams(url.searchParams)
	const filter = searchParams.getAll("filter")

	// フィルターが空の場合は、すべてのパートのIDを使用
	const allPartIds = wallet?.parts.map((part) => part.id) || []
	const targetPartIds = filter.length > 0 ? filter : allPartIds

	const filteredPurchases = await prisma.purchase.findMany({
		where: {
			part: {
				id: {
					in: targetPartIds,
				},
			},
			...PurchaseRecordableWhereQuery,
		},
		select: PurchaseRecordableSelectQuery,
		orderBy: PurchaseRecordableOrderByQuery,
	})
	const filteredParts = await prisma.part.findMany({
		where: {
			id: {
				in: targetPartIds,
			},
		},
		select: {
			id: true,
			name: true,
			budget: true,
		},
	})
	const isAccountant = await queryIsStudentInCharge(partId, student.id)

	return {
		parts: wallet?.parts || [],
		filter,
		filteredPurchases,
		filteredParts,
		wallet: wallet ? { id: wallet.id, name: wallet.name } : null,
		isAccountant,
	}
}

const formSchema = z.object({
	receiptIndex: z.coerce.number().min(0),
	label: z.string(),
	actualUsage: z.coerce.number().min(1),
	part: z.string().optional(),
})

export default ({ loaderData, actionData }: Route.ComponentProps) => {
	const submit = useSubmit()
	const [form, fields] = useForm({
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: formSchema })
		},
		onSubmit(e, { formData }) {
			e.preventDefault()
			formData.set("partName", partName ?? "")
			submit(formData, { method: "post" })
		},
		lastResult: null,
		shouldRevalidate: "onBlur",
		shouldValidate: "onInput",
	})
	const [partName, setPartName] = useState<string | null>(null)
	return (
		<>
			<Section>
				<SectionTitle>
					<Title>出納簿</Title>
				</SectionTitle>
				<SectionContent>
					<CashBookFilter parts={loaderData.parts} filter={loaderData.filter} />
				</SectionContent>
				<SectionContent>
					<CashBookTable
						purchases={loaderData.filteredPurchases}
						filteredParts={loaderData.filteredParts}
						wallet={loaderData.wallet}
					/>
				</SectionContent>
			</Section>
			<Section>
				<Form method="post" {...getFormProps(form)}>
					<FormBody>
						<FormField label="レシート番号" name={fields.receiptIndex.id} error={fields.receiptIndex.errors}>
							<Input {...getInputProps(fields.receiptIndex, { type: "number" })} />
						</FormField>
						<FormField label="項目名" name={fields.label.id} error={fields.label.errors}>
							<Input {...getInputProps(fields.label, { type: "text" })} />
						</FormField>
						<FormField label="使用額" name={fields.actualUsage.id} error={fields.actualUsage.errors}>
							<Input {...getInputProps(fields.actualUsage, { type: "number" })} />
						</FormField>
						<FormField label="パート" name={fields.part.id} error={fields.part.errors}>
							<Popover>
								<PopoverTrigger asChild>
									<Button variant="outline">{partName}</Button>
								</PopoverTrigger>
								<PopoverContent className="w-[200px] p-0">
									<Command>
										<CommandList>
											<CommandGroup>
												{loaderData.parts.map((part) => (
													<CommandItem
														key={part.id}
														onSelect={() => {
															setPartName(part.name)
														}}
													>
														{part.name}
													</CommandItem>
												))}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
						</FormField>
					</FormBody>
					<FormFooter>
						<Button type="submit">作成</Button>
					</FormFooter>
				</Form>
			</Section>
		</>
	)
}

export const action = async ({ request, params }: Route.ActionArgs) => {
	const { partId, student, session } = await entryStudentRoute(request, params.partId)
	const errorRedirect = buildErrorRedirect(`/app/student/part/${partId}/cash-book`, session)
	try {
		const formData = await request.formData()
		const body = formSchema.parse(Object.fromEntries(formData.entries()))
		const purchase = await prisma.purchase.create({
			data: {
				label: body.label,
				plannedUsage: body.actualUsage,
				part: {
					connect: {
						id: partId,
					},
				},
				requestedBy: {
					connectOrCreate: {
						create: {
							id: "tempStudent",
							email: "tempStudent",
							name: "tempStudent",
						},
						where: {
							id: "tempStudent",
						},
					},
				},
				accountantApproval: {
					create: {
						approved: true,
						by: {
							connectOrCreate: {
								create: {
									id: "tempStudent",
									email: "tempStudent",
									name: "tempStudent",
								},
								where: {
									id: "tempStudent",
								},
							},
						},
					},
				},
				teacherApproval: {
					create: {
						approved: true,
						by: {
							connectOrCreate: {
								create: {
									id: "tempTeacher",
									email: "tempTeacher",
									name: "tempTeacher",
								},
								where: {
									id: "tempTeacher",
								},
							},
						},
					},
				},
				completion: {
					create: {
						actualUsage: body.actualUsage,
					},
				},
				receiptSubmission: {
					create: {
						receiptIndex: body.receiptIndex,
						submittedTo: {
							connectOrCreate: {
								create: {
									id: "tempStudent",
									email: "tempStudent",
									name: "tempStudent",
								},
								where: {
									id: "tempStudent",
								},
							},
						},
					},
				},
			},
		})
		return null
	} catch (_) {
		console.log(_)
		return await errorRedirect("追加に失敗しました。")
	}
}
