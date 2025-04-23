import { Plus } from "lucide-react"
import { Loader2 } from "lucide-react"
import { useMemo, useState } from "react"
import { Form } from "react-router"
import { useFetcher } from "react-router"
import { Link } from "react-router"
import { z } from "zod"
import { Section, SectionTitle } from "~/components/common/container"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Separator } from "~/components/ui/separator"
import { prisma } from "~/services/repository.server"
import { createErrorRedirect, createSuccessRedirect } from "~/services/session.server"
import { getSession, verifyStudent } from "~/services/session.server"
import { useProductAddStore } from "~/stores/product-add"
import { useProductSelectStore } from "~/stores/product-select"
import { formatMoney } from "~/utilities/display"
import type { Route } from "./+types/index"
import { ProductAddForm } from "./components/product-add-form"
import { ProductItem } from "./components/product-item"
import { ProductSelection } from "./components/product-selection"

const purchaseBodySchema = z.object({
	partId: z.string(),
	label: z.string(),
	addedProducts: z.array(
		z.object({
			id: z.string(),
			info: z.object({
				name: z.string(),
				price: z.number(),
				description: z.string().optional(),
			}),
			quantity: z.number(),
			isShared: z.boolean(),
		}),
	),
	selectedProducts: z.array(
		z.object({
			id: z.string(),
			quantity: z.number(),
		}),
	),
})

type purchaseBodyType = z.infer<typeof purchaseBodySchema>

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const studentId = await verifyStudent(session)
	const errorRedirect = createErrorRedirect(session, "/app/student")
	const part = await prisma.part
		.findFirstOrThrow({
			where: {
				students: {
					some: {
						id: studentId,
					},
				},
			},
		})
		.catch(errorRedirect("パートを取得できませんでした。").catch())
	const products = await prisma.product
		.findMany({
			where: {
				isShared: true,
			},
			select: {
				id: true,
				name: true,
				price: true,
			},
		})
		.catch(errorRedirect("商品を取得できませんでした。").catch())
	return { products, part }
}

export default ({ loaderData: { part, products } }: Route.ComponentProps) => {
	const [label, setLabel] = useState("")
	const productSelectStore = useProductSelectStore()
	const productAddStore = useProductAddStore()
	const getTotalPrice = useMemo(() => {
		return (
			productAddStore.getAllAsObject().reduce((acc, item) => acc + item.info.price * item.quantity, 0) +
			productSelectStore.getAllAsObject().reduce((acc, item) => acc + item.info.price * item.quantity, 0)
		)
	}, [productAddStore, productSelectStore])
	const getTempLabel = useMemo(() => {
		return [...productSelectStore.getAllAsObject(), ...productAddStore.getAllAsObject()]
			.map((product) => `${product.info.name} ${product.quantity}個`)
			.join("、")
	}, [productAddStore, productSelectStore])
	const fetcher = useFetcher()
	const handleSubmit = () => {
		const body: purchaseBodyType = {
			partId: part.id,
			label: label || getTempLabel,
			addedProducts: productAddStore.getAllAsObject(),
			selectedProducts: productSelectStore.getAllAsObject().map((product) => ({ id: product.id, quantity: product.quantity })),
		}
		fetcher.submit(body, {
			method: "post",
			encType: "application/json",
		})
	}
	return (
		<Section>
			<SectionTitle className="font-bold text-lg">新規購入リクエスト</SectionTitle>
			<div className="space-y-4">
				<div className="space-y-2">
					<Label>購入リクエストの説明</Label>
					<Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={getTempLabel || "省略可能"} />
				</div>
				<Form className="flex flex-row gap-4 w-full" replace={true}>
					<Button variant="outline" className="grow justify-between" name="form" value="select">
						商品を選択
						<Plus className="opacity-50" />
					</Button>
					<Button variant="outline" className="grow justify-between" name="form" value="add">
						商品を追加
						<Plus className="opacity-50" />
					</Button>
				</Form>
				<ProductAddForm />
				<ProductSelection products={products} />
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:grid-cols-2">
					{productSelectStore.getAllAsObject().map((product) => (
						<ProductItem key={product.id} store={productSelectStore} purchaseItem={product} type="selected" />
					))}
					{productAddStore.getAllAsObject().map((product) => (
						<ProductItem key={product.id} store={productAddStore} purchaseItem={product} type={product.isShared ? "shared" : "private"} />
					))}
				</div>
				<Separator />
				<div className="flex justify-between">
					<div>合計金額：</div>
					<div className="text-lg font-bold">{formatMoney(getTotalPrice)}</div>
				</div>
				<div className="flex flex-col desk:flex-row gap-2">
					<Link to={`/app/student/part/${part.id}`} className="flex-1">
						<Button variant="outline" className="w-full">
							キャンセル
						</Button>
					</Link>
					<Button className="flex-1" type="submit" onClick={handleSubmit} disabled={getTotalPrice === 0 || fetcher.state !== "idle"}>
						{fetcher.state === "submitting" && <Loader2 className="animate-spin" />}
						{fetcher.state === "submitting" ? "送信中..." : "購入リクエスト"}
					</Button>
				</div>
			</div>
		</Section>
	)
}

export const action = async ({ request, params: { partId } }: Route.ActionArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const studentId = await verifyStudent(session)
	const body = await request.json()
	const errorRedirect = createErrorRedirect(session, `/app/student/part/${partId}`)
	const successRedirect = createSuccessRedirect(session, `/app/student/part/${partId}`)
	const { addedProducts, selectedProducts, label } = await purchaseBodySchema.parseAsync(body).catch(errorRedirect("購入のリクエストに失敗しました。").catch())
	await prisma.purchase
		.create({
			data: {
				label,
				part: {
					connect: {
						id: partId,
					},
				},
				requestCert: {
					create: {
						signedBy: {
							connect: {
								id: studentId,
							},
						},
						approved: true,
					},
				},
				items: {
					create: [
						...addedProducts.map((product) => ({
							product: {
								create: {
									name: product.info.name,
									price: product.info.price,
									isShared: product.isShared,
								},
							},
							quantity: product.quantity,
						})),
						...selectedProducts.map((product) => ({
							product: {
								connect: { id: product.id },
							},
							quantity: product.quantity,
						})),
					],
				},
			},
		})
		.catch(errorRedirect("購入のリクエストに失敗しました。").catch())
	return successRedirect("購入リクエストを送信しました。")
}
