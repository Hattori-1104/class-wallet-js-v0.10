import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import type { Prisma } from "@prisma/client"
import { Form } from "react-router"
import { z } from "zod"
import { Section } from "~/components/common/container"
import { SectionTitle } from "~/components/common/container"
import { Distant } from "~/components/common/placement"
import { NoData, Note, Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible"
import { Input } from "~/components/ui/input"
import { FormBody, FormField } from "~/components/utility/form"
import { formatDiffDate } from "~/utilities/display"

type Purchase = Prisma.PurchaseGetPayload<{
	select: {
		plannedUsage: true
		state: {
			select: {
				givenMoney: {
					select: {
						amount: true
						at: true
					}
				}
			}
		}
	}
}>

const ActionSchema = z.object({
	givenMoney: z.number().min(0),
})

export const parseGivenMoneyAction = (formData: FormData) => parseWithZod(formData, { schema: ActionSchema })

export const GivenMoney = ({ purchase, isRequester }: { purchase: Purchase; isRequester: boolean }) => {
	const [form, fields] = useForm({
		lastResult: null,
		onValidate({ formData }) {
			return parseGivenMoneyAction(formData)
		},
		defaultValue: {
			givenMoney: purchase.plannedUsage,
		},
		shouldValidate: "onBlur",
		shouldRevalidate: "onInput",
	})
	return (
		<>
			<Section>
				<SectionTitle>
					<Title>現金受け取り</Title>
				</SectionTitle>
				{purchase.state.givenMoney ? (
					<Distant>
						<div>{purchase.state.givenMoney.amount}円</div>
						<Note>{formatDiffDate(purchase.state.givenMoney.at, Date.now())}</Note>
					</Distant>
				) : (
					<NoData>受け取りが完了していません。</NoData>
				)}
			</Section>
			{isRequester && (
				<Section>
					<Collapsible>
						<SectionTitle>
							<CollapsibleTrigger asChild>
								<Button variant="outline" className="w-full">
									受け取り額の入力
								</Button>
							</CollapsibleTrigger>
						</SectionTitle>
						<CollapsibleContent>
							<Form method="post" {...getFormProps(form)}>
								<FormBody>
									<FormField name={fields.givenMoney.name} label="受け取り金額" error={fields.givenMoney.errors}>
										<Input {...getInputProps(fields.givenMoney, { type: "number" })} />
									</FormField>
									<Button type="submit" className="w-full">
										受け取り
									</Button>
								</FormBody>
							</Form>
						</CollapsibleContent>
					</Collapsible>
				</Section>
			)}
		</>
	)
}
