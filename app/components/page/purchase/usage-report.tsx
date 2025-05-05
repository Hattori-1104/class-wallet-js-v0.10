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
				usageReport: {
					select: {
						actualUsage: true
						at: true
					}
				}
			}
		}
	}
}>

const ActionSchema = z.object({
	actualUsage: z.number().min(0),
})

export const parseUsageReportAction = (formData: FormData) => parseWithZod(formData, { schema: ActionSchema })

export const UsageReport = ({ purchase, isRequester }: { purchase: Purchase; isRequester: boolean }) => {
	const [form, fields] = useForm({
		lastResult: null,
		onValidate({ formData }) {
			return parseUsageReportAction(formData)
		},
		defaultValue: {
			actualUsage: purchase.plannedUsage,
		},
		shouldValidate: "onBlur",
		shouldRevalidate: "onInput",
	})
	return (
		<>
			<Section>
				<SectionTitle>
					<Title>使用額の報告</Title>
				</SectionTitle>
				{purchase.state.usageReport ? (
					<Distant>
						<div>{purchase.state.usageReport.actualUsage}円</div>
						<Note>{formatDiffDate(purchase.state.usageReport.at, Date.now())}</Note>
					</Distant>
				) : (
					<NoData>使用額の報告が完了していません。</NoData>
				)}
			</Section>
			{isRequester && (
				<Section>
					<Collapsible>
						<SectionTitle>
							<CollapsibleTrigger asChild>
								<Button variant="outline" className="w-full">
									使用額の報告
								</Button>
							</CollapsibleTrigger>
						</SectionTitle>
						<CollapsibleContent>
							<Form method="post" {...getFormProps(form)}>
								<FormBody>
									<FormField name={fields.actualUsage.name} label="使用額" error={fields.actualUsage.errors}>
										<Input {...getInputProps(fields.actualUsage, { type: "number" })} />
									</FormField>
									<Button type="submit" className="w-full">
										報告
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
