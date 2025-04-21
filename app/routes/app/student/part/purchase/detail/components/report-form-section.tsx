import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import { Form } from "react-router"
import { z } from "zod"
import { Section } from "~/components/common/container"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { formatMoney } from "~/utilities/display"

export const ReportFormSection = ({ plannedUsage }: { plannedUsage: number }) => {
	const FormSchema = z.object({
		actualUsage: z.number().min(0).max(plannedUsage),
	})
	const [form, fields] = useForm({
		lastResult: null,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: FormSchema })
		},
		shouldRevalidate: "onBlur",
		shouldValidate: "onInput",
	})

	return (
		<Section>
			<Form {...getFormProps(form)} method="post" className="space-y-4">
				<input name="intent" value="report" hidden readOnly />
				<div className="space-y-4">
					<div className="space-y-1">
						<Label htmlFor={fields.actualUsage.id}>実際の使用金額</Label>
						<Input {...getInputProps(fields.actualUsage, { type: "number" })} />
						<div className="text-red-500 text-sm">{fields.actualUsage.errors?.join(", ")}</div>
					</div>
					<div className="flex flex-row justify-between">
						<span className="font-bold">お釣り：</span>
						<span className="font-bold">{formatMoney(plannedUsage - Number(fields.actualUsage.value || 0))}</span>
					</div>
				</div>
				<Button type="submit" name="action" value="report" className="w-full">
					購入完了
				</Button>
			</Form>
		</Section>
	)
}
