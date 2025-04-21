import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import { useState } from "react"
import { Form, Link, redirect, useSearchParams } from "react-router"
import { z } from "zod"
import { Button } from "~/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Switch } from "~/components/ui/switch"
import { useProductAddStore } from "~/stores/product-add"

const productAddSchema = z.object({
	name: z.string({ required_error: "商品名を入力してください" }).max(50),
	price: z.coerce
		.number({ required_error: "価格を入力してください", invalid_type_error: "価格を入力してください" })
		.min(1, { message: "1円以上入力してください" })
		.max(1000000, { message: "100万円以下で入力してください" }),
	description: z.string().optional(),
})

const formId = "product-add-form"

export const ProductAddForm = () => {
	const productAddStore = useProductAddStore()
	const [searchParams, setSearchParams] = useSearchParams()
	const isOpen = Boolean(searchParams.get("form") === "add")
	const close = () => {
		setSearchParams((prev) => {
			prev.delete("form")
			return prev
		})
	}
	const onOpenChange = () => {
		setSearchParams((prev) => {
			if (prev.has("form")) prev.delete("form")
			else prev.set("form", "add")
			return prev
		})
	}
	const [isShared, setIsShared] = useState(false)
	const [form, fields] = useForm({
		id: formId,
		lastResult: null,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: productAddSchema })
		},
		onSubmit(event, { formData }) {
			event.preventDefault()
			const { success, data } = productAddSchema.safeParse(Object.fromEntries(formData.entries()))
			if (success) {
				productAddStore.add(
					{
						name: data.name,
						price: data.price,
						description: data.description,
					},
					isShared,
				)
				close()
			}
		},
		shouldValidate: "onSubmit",
		shouldRevalidate: "onInput",
	})
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>新規商品を追加</DialogTitle>
					<DialogDescription>未登録の商品情報を入力してください。</DialogDescription>
				</DialogHeader>
				<Form {...getFormProps(form)} className="space-y-4 my-4" replace>
					<div className="space-y-4">
						<div className="space-y-1">
							<Label htmlFor={fields.name.id}>商品名</Label>
							<Input {...getInputProps(fields.name, { type: "text" })} />
							<div className="text-red-500 text-sm">{fields.name.errors?.join(", ")}</div>
						</div>

						<div className="space-y-1">
							<Label htmlFor={fields.price.id}>価格</Label>
							<Input {...getInputProps(fields.price, { type: "number" })} />
							<div className="text-red-500 text-sm">{fields.price.errors?.join(", ")}</div>
						</div>

						<div className="space-y-1">
							<Label htmlFor={fields.description.id}>
								<span>備考</span>
								<span className="font-normal text-muted-foreground"> - 省略可</span>
							</Label>
							<Input {...getInputProps(fields.description, { type: "text" })} />
							<div className="text-red-500 text-sm">{fields.description.errors?.join(", ")}</div>
						</div>
					</div>
					<div className="flex items-center justify-end gap-2">
						<Label htmlFor="isShared" className="text-right">
							この商品を登録する
						</Label>
						<Switch id="isShared" checked={isShared} onCheckedChange={setIsShared} />
					</div>
				</Form>
				<DialogFooter>
					<DialogClose asChild>
						<div className="w-full flex flex-row gap-4">
							<Button variant={"outline"} asChild className="grow">
								<Link to="./">キャンセル</Link>
							</Button>
							<Button variant={"default"} className="grow" type={"submit"} form={formId}>
								追加
							</Button>
						</div>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
