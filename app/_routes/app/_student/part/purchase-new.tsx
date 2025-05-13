import { z } from "zod"
import {
	Section,
	SectionContent,
	SectionTitle,
} from "~/components/common/container"
import { Heading, Note, Title } from "~/components/common/typography"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "~/components/ui/command"

import { getFormProps, getInputProps, useForm } from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import type { Prisma } from "@prisma/client"
import { Check, Minus, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { Form, useNavigate, useSubmit } from "react-router"
import { create } from "zustand"
import { LightBox } from "~/components/common/box"
import { Aside, Distant } from "~/components/common/placement"
import { Button } from "~/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Switch } from "~/components/ui/switch"
import { FormBody, FormField, FormFooter } from "~/components/utility/form"
import { cn } from "~/lib/utils"
import { partWithUserWhereQuery, prisma } from "~/services/repository.server"
import { verifyStudent } from "~/services/route-module.server"
import {
	_createErrorRedirect,
	_createSuccessRedirect,
	requireSession,
} from "~/services/session.server"
import { getSwitchProps } from "~/utilities/conform-helper"
import { formatMoney } from "~/utilities/display"
import type { Route } from "./+types/purchase-new"
const selectedProductSchema = z.object({
	id: z.string(),
	quantity: z.number().min(1),
})

const createProductSchema = z.object({
	name: z.string(),
	price: z.number().min(0),
	quantity: z.number().min(1).default(1),
	isShared: z.boolean().default(false),
})
type CreateProduct = z.infer<typeof createProductSchema>

const purchaseRequestSchema = z.object({
	label: z.string(),
	plannedUsage: z.number().min(0),
	selectedProducts: z.array(selectedProductSchema),
	createdProducts: z.array(createProductSchema),
})
type PurchaseRequest = z.infer<typeof purchaseRequestSchema>

const useSelectedProductStore = create<{
	selectedProductSet: Map<string, number>
	isSelected: (id: string) => boolean
	toggleSelect: (id: string) => void
	getAsObject: () => { id: string; quantity: number }[]
	addQuantity: (id: string, quantity: number) => void
	setQuantity: (id: string, quantity: number) => void
	clear: () => void
}>((set, get) => ({
	selectedProductSet: new Map(),
	isSelected: (id: string) => get().selectedProductSet.has(id),
	toggleSelect: (id: string) =>
		set((state) => {
			const newSet = new Map(state.selectedProductSet)
			if (newSet.has(id)) {
				newSet.delete(id)
			} else {
				newSet.set(id, 1)
			}
			return { selectedProductSet: newSet }
		}),
	getAsObject: () => {
		return Array.from(get().selectedProductSet.entries()).map(
			([id, quantity]) => ({ id, quantity }),
		)
	},
	addQuantity: (id: string, quantity: number) => {
		set((state) => {
			const newSet = new Map(state.selectedProductSet)
			if (newSet.has(id)) {
				const newQuantity = newSet.get(id)! + quantity
				if (newQuantity <= 0) {
					newSet.delete(id)
				} else {
					newSet.set(id, newQuantity)
				}
			}
			return { selectedProductSet: newSet }
		})
	},
	setQuantity: (id: string, quantity: number) => {
		set((state) => {
			const newSet = new Map(state.selectedProductSet)
			if (newSet.has(id)) {
				if (quantity <= 0) {
					newSet.delete(id)
				} else {
					newSet.set(id, quantity)
				}
			}
			return { selectedProductSet: newSet }
		})
	},
	clear: () => {
		set({ selectedProductSet: new Map() })
	},
}))

const useCreatedProductStore = create<{
	createdProductSet: Map<string, CreateProduct>
	addProduct: (product: CreateProduct) => void
	removeProduct: (id: string) => void
	addQuantity: (id: string, quantity: number) => void
	setQuantity: (id: string, quantity: number) => void
	clear: () => void
}>((set) => ({
	createdProductSet: new Map(),
	addProduct: (product) => {
		set((state) => {
			const newSet = new Map(state.createdProductSet)
			newSet.set(crypto.randomUUID(), product)
			return { createdProductSet: newSet }
		})
	},
	removeProduct: (id: string) => {
		set((state) => {
			const newSet = new Map(state.createdProductSet)
			newSet.delete(id)
			return { createdProductSet: newSet }
		})
	},
	addQuantity: (id: string, quantity: number) => {
		set((state) => {
			const newSet = new Map(state.createdProductSet)
			const product = newSet.get(id)
			if (!product) return { createdProductSet: newSet }
			const newQuantity = product.quantity + quantity
			if (newQuantity <= 0) {
				newSet.delete(id)
			} else {
				newSet.set(id, { ...product, quantity: newQuantity })
			}
			return { createdProductSet: newSet }
		})
	},
	setQuantity: (id: string, quantity: number) => {
		set((state) => {
			const newSet = new Map(state.createdProductSet)
			if (newSet.has(id)) {
				if (quantity <= 0) {
					newSet.delete(id)
				} else {
					newSet.set(id, { ...newSet.get(id)!, quantity })
				}
			}
			return { createdProductSet: newSet }
		})
	},
	clear: () => {
		set({ createdProductSet: new Map() })
	},
}))

export const loader = async ({
	params: { partId },
	request,
}: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)

	const sharedProducts = await prisma.product.findMany({
		where: {
			isShared: true,
		},
		select: {
			id: true,
			name: true,
			price: true,
		},
	})
	return { sharedProducts }
}

export default ({ loaderData: { sharedProducts } }: Route.ComponentProps) => {
	const navigate = useNavigate()
	const submit = useSubmit()
	const {
		isSelected,
		toggleSelect,
		selectedProductSet,
		addQuantity: addSelectedQuantity,
		setQuantity: setSelectedQuantity,
		clear: clearSelectedProduct,
	} = useSelectedProductStore()
	const {
		addProduct,
		addQuantity: addCreatedQuantity,
		createdProductSet,
		setQuantity: setCreatedQuantity,
		clear: clearCreatedProduct,
	} = useCreatedProductStore()
	const [createProductDialogOpen, setCreateProductDialogOpen] = useState(false)
	const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
	const [label, setLabel] = useState("")
	const [plannedUsage, setPlannedUsage] = useState<number | null>(null)

	const defaultLabel = useMemo(() => {
		return [
			...selectedProductSet
				.entries()
				.map(([id, quantity]) => {
					const product = sharedProducts.find((product) => product.id === id)
					if (!product) return null
					return `${product.name} ${quantity}個`
				})
				.filter((item) => item),
			...createdProductSet.entries().map(([_, product]) => {
				return `${product.name} ${product.quantity}個`
			}),
		].join(",")
	}, [selectedProductSet, createdProductSet, sharedProducts])
	const defaultPlannedUsage = useMemo(() => {
		return (
			Array.from(selectedProductSet.entries()).reduce(
				(acc, [id, quantity]) =>
					acc +
					quantity * sharedProducts.find((product) => product.id === id)!.price,
				0,
			) +
			Array.from(createdProductSet.entries()).reduce(
				(acc, [_, product]) => acc + product.quantity * product.price,
				0,
			)
		)
	}, [selectedProductSet, createdProductSet, sharedProducts])

	const handleSubmit = () => {
		const purchaseRequest: PurchaseRequest = {
			label: label || defaultLabel,
			plannedUsage: plannedUsage || defaultPlannedUsage,
			selectedProducts: Array.from(selectedProductSet.entries()).map(
				([id, quantity]) => ({ id, quantity }),
			),
			createdProducts: Array.from(createdProductSet.entries()).map(
				([id, product]) => ({ id, ...product }),
			),
		}
		clearSelectedProduct()
		clearCreatedProduct()
		submit(purchaseRequest, {
			method: "POST",
			encType: "application/json",
		})
	}
	return (
		<Section>
			<SectionTitle>
				<Title>新規購入をリクエスト</Title>
			</SectionTitle>
			<SectionContent asChild>
				<Aside>
					<Dialog>
						<DialogTrigger asChild>
							<Button variant="outline">
								<Plus />
								<span>商品を選択</span>
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>商品を選択</DialogTitle>
								<DialogDescription>
									共有されている商品を選択することができます。
								</DialogDescription>
							</DialogHeader>
							<Command>
								<CommandInput placeholder="商品を検索" />
								<CommandList>
									<CommandEmpty>共有されている商品がありません。</CommandEmpty>
									<CommandGroup>
										{sharedProducts.map((product) => (
											<CommandItem
												key={product.id}
												onSelect={() => toggleSelect(product.id)}
											>
												<Distant>
													<div>
														<Heading>{product.name}</Heading>
														<Note>{formatMoney(product.price)}</Note>
													</div>
													<Check
														className={cn(
															isSelected(product.id)
																? "opacity-100"
																: "opacity-0",
														)}
													/>
												</Distant>
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</DialogContent>
					</Dialog>
					<Dialog
						open={createProductDialogOpen}
						onOpenChange={() => setCreateProductDialogOpen((prev) => !prev)}
					>
						<DialogTrigger asChild>
							<Button variant="outline">
								<Plus />
								<span>商品を作成</span>
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>商品を作成</DialogTitle>
								<DialogDescription>
									新規で商品を作成することができます。
								</DialogDescription>
							</DialogHeader>
							{(() => {
								const [form, fields] = useForm({
									lastResult: null,
									onValidate({ formData }) {
										return parseWithZod(formData, {
											schema: createProductSchema,
										})
									},
									onSubmit(event, { formData }) {
										event.preventDefault()
										const result = parseWithZod(formData, {
											schema: createProductSchema,
										})
										if (result.status !== "success") return result.reply()
										addProduct(result.value)
										setCreateProductDialogOpen(false)
									},
									shouldRevalidate: "onBlur",
									shouldValidate: "onInput",
									defaultValue: {
										quantity: 1,
									},
								})
								return (
									<Form {...getFormProps(form)}>
										<FormBody>
											<FormField
												label="商品名"
												name={fields.name.id}
												error={fields.name.errors}
											>
												<Input
													{...getInputProps(fields.name, { type: "text" })}
												/>
											</FormField>
											<FormField
												label="価格"
												name={fields.price.id}
												error={fields.price.errors}
											>
												<Input
													{...getInputProps(fields.price, { type: "number" })}
												/>
											</FormField>
											<FormField
												label="数量"
												name={fields.quantity.id}
												error={fields.quantity.errors}
											>
												<Input
													{...getInputProps(fields.quantity, {
														type: "number",
													})}
													placeholder="1"
												/>
											</FormField>
											<FormField
												name={fields.isShared.id}
												error={fields.isShared.errors}
											>
												<Distant>
													<Label htmlFor={fields.isShared.id}>
														{fields.isShared.value ? "共有する" : "共有しない"}
													</Label>
													<Switch {...getSwitchProps(fields.isShared)} />
												</Distant>
											</FormField>
										</FormBody>
										<FormFooter>
											<Aside>
												<Button
													className="grow"
													variant="outline"
													type="button"
													onClick={() => setCreateProductDialogOpen(false)}
												>
													キャンセル
												</Button>
												<Button className="grow" type="submit">
													追加
												</Button>
											</Aside>
										</FormFooter>
									</Form>
								)
							})()}
						</DialogContent>
					</Dialog>
				</Aside>
			</SectionContent>
			<SectionContent className="space-y-2">
				{Array.from(selectedProductSet.keys()).map((id) => {
					const product = sharedProducts.find((product) => product.id === id)
					if (!product) return null
					return (
						<PurchaseItem
							key={id}
							id={id}
							product={product}
							quantity={selectedProductSet.get(id)!}
							addQuantity={addSelectedQuantity}
							setQuantity={setSelectedQuantity}
						/>
					)
				})}
				{Array.from(createdProductSet.entries()).map(([id, product]) => {
					return (
						<PurchaseItem
							key={id}
							id={id}
							product={product}
							quantity={product.quantity}
							addQuantity={addCreatedQuantity}
							setQuantity={setCreatedQuantity}
						/>
					)
				})}
			</SectionContent>
			<SectionContent>
				<FormBody>
					<FormField label="購入リクエスト名" name="purchaseLabel">
						<Input
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							placeholder={defaultLabel}
						/>
					</FormField>
					<FormField label="使用予定額" name="plannedUsage">
						<Input
							value={plannedUsage ?? ""}
							onChange={(e) => {
								const value = Number.parseInt(e.target.value)
								if (Number.isNaN(value)) {
									setPlannedUsage(null)
								} else {
									setPlannedUsage(value)
								}
							}}
							type="number"
							className="no-spin text-right"
							placeholder={formatMoney(defaultPlannedUsage)}
						/>
					</FormField>
				</FormBody>
			</SectionContent>
			<SectionContent>
				<Aside>
					<Button
						variant="outline"
						className="grow"
						onClick={() => navigate(-1)}
					>
						キャンセル
					</Button>
					<Dialog
						open={submitDialogOpen}
						onOpenChange={() => setSubmitDialogOpen((prev) => !prev)}
					>
						<DialogTrigger asChild>
							<Button
								variant="default"
								className="grow"
								disabled={!(label || defaultLabel)}
							>
								リクエストを送信
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>リクエストの送信</DialogTitle>
								<DialogDescription>
									この内容でリクエストを送信します。
								</DialogDescription>
							</DialogHeader>
							<LightBox>
								<Distant>
									<Title className="block text-wrap">
										{label || defaultLabel}
									</Title>
									<Note className="block shrink-0 text-right">
										{formatMoney(plannedUsage ?? defaultPlannedUsage)}
									</Note>
								</Distant>
							</LightBox>
							<DialogFooter>
								<Aside>
									<Button
										variant="outline"
										className="grow"
										onClick={() => setSubmitDialogOpen(false)}
									>
										キャンセル
									</Button>
									<Button
										variant="default"
										className="grow"
										onClick={handleSubmit}
									>
										リクエストを送信
									</Button>
								</Aside>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</Aside>
			</SectionContent>
		</Section>
	)
}

function PurchaseItem({
	id,
	product,
	quantity,
	addQuantity,
	setQuantity,
}: {
	id: string
	product: { name: string; price: number }
	quantity: number
	addQuantity: (id: string, quantity: number) => void
	setQuantity: (id: string, quantity: number) => void
}) {
	return (
		<LightBox key={id} className="py-3 px-4">
			<Distant>
				<div>
					<p>{product.name}</p>
					<Note>{formatMoney(product.price)}</Note>
				</div>
				<Aside gap="xs">
					<Button
						variant="ghost"
						size="icon"
						type="button"
						onClick={() => addQuantity(id, -1)}
					>
						<Minus />
					</Button>
					<Input
						type="number"
						className="w-10 px-0 no-spin text-center"
						value={quantity}
						onChange={(e) => setQuantity(id, Number.parseInt(e.target.value))}
					/>
					<Button
						variant="ghost"
						size="icon"
						type="button"
						onClick={() => addQuantity(id, 1)}
					>
						<Plus />
					</Button>
				</Aside>
			</Distant>
		</LightBox>
	)
}

export const action = async ({
	request,
	params: { partId },
}: Route.ActionArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	const errorRedirect = _createErrorRedirect(
		session,
		`app/student/part/${partId}`,
	)
	const part = await prisma.part
		.findUniqueOrThrow({
			where: {
				...partWithUserWhereQuery(partId, student.id),
			},
		})
		.catch(errorRedirect("パートが見つかりません。").catch())

	const result = await purchaseRequestSchema
		.parseAsync(await request.json())
		.catch(
			errorRedirect(
				"購入リクエストの形式が正しくありません。",
				`/app/student/part/${partId}/new-purchase`,
			).catch(),
		)

	await prisma.purchase
		.create({
			data: {
				label: result.label,
				plannedUsage: result.plannedUsage,
				part: {
					connect: {
						id: part.id,
					},
				},
				state: {
					create: {
						request: {
							create: {
								approved: true,
								by: {
									connect: {
										id: student.id,
									},
								},
							},
						},
					},
				},
				items: {
					create: [
						...result.selectedProducts.map(
							(product) =>
								({
									product: {
										connect: {
											id: product.id,
										},
									},
								}) satisfies Prisma.PurchaseItemCreateWithoutPurchaseInput,
						),
						...result.createdProducts.map(
							(product) =>
								({
									product: {
										create: {
											name: product.name,
											price: product.price,
											isShared: product.isShared,
										},
									},
									quantity: product.quantity,
								}) satisfies Prisma.PurchaseItemCreateWithoutPurchaseInput,
						),
					],
				},
			},
		})
		.catch(errorRedirect("購入リクエストの作成に失敗しました。").catch())

	const successRedirect = _createSuccessRedirect(
		session,
		`/app/student/part/${partId}`,
	)
	return successRedirect("購入リクエストを送信しました。")
}
