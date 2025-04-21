import { AlertCircle, ChevronLeft, ChevronRight, Flag } from "lucide-react"
import { useCallback, useMemo } from "react"
import { Form, Link } from "react-router"
import { z } from "zod"
import { Section, SectionTitle } from "~/components/common/container"
import { Button } from "~/components/ui/button"
import { createErrorRedirect, prisma } from "~/services/repository.server"
import { getSession, verifyStudent } from "~/services/session.server"
import { getPurchaseState } from "~/utilities/calc"
import { formatMoney } from "~/utilities/display"
import type { Route } from "./+types/index"

export const loader = async ({ request, params: { partId } }: Route.LoaderArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const studentId = await verifyStudent(session)
	const errorRedirect = createErrorRedirect(session, `/app/student/part/${partId}/purchase`)
	// パートの購入リクエスト数を取得
	const {
		_count: { purchases: partPurchaseCount },
	} = await prisma.part
		.findUniqueOrThrow({
			where: {
				id: partId,
				students: {
					some: {
						id: studentId,
					},
				},
			},
			select: {
				_count: {
					select: {
						purchases: true,
					},
				},
			},
		})
		.catch(errorRedirect("パートを取得できませんでした。").catch())

	// ページインデックスのバリデーション
	const pageIndex = await z.coerce
		.number()
		.min(0)
		.max((partPurchaseCount / 10) | 0)
		.parseAsync(new URL(request.url).searchParams.get("pageIndex"))
		.catch(() => 0)

	const part = await prisma.part
		.findUniqueOrThrow({
			where: {
				id: partId,
				students: {
					some: {
						id: studentId,
					},
				},
			},
			select: {
				id: true,
				name: true,
				_count: {
					select: {
						purchases: true,
					},
				},
				purchases: {
					select: {
						id: true,
						label: true,
						returnedAt: true,
						completedAt: true,
						actualUsage: true,
						requestCert: {
							select: {
								signedBy: {
									select: {
										id: true,
										name: true,
									},
								},
								approved: true,
							},
						},
						accountantCert: {
							select: {
								signedBy: {
									select: {
										id: true,
										name: true,
									},
								},
								approved: true,
							},
						},
						teacherCert: {
							select: {
								signedBy: {
									select: {
										id: true,
										name: true,
									},
								},
								approved: true,
							},
						},
						items: {
							select: {
								id: true,
								quantity: true,
								product: {
									select: {
										id: true,
										name: true,
										price: true,
									},
								},
							},
						},
					},
					take: 10,
					skip: pageIndex * 10,
				},
			},
		})
		.catch(errorRedirect("購入リクエスト一覧を取得できませんでした。").catch())

	const pageIndexMax = (partPurchaseCount / 10) | 0
	return { part, pageIndex, pageIndexMax }
}

export default ({ loaderData: { part, pageIndex, pageIndexMax } }: Route.ComponentProps) => {
	const Pagination = useCallback(() => {
		return (
			<Form className="flex flex-row gap-2 justify-center items-center" replace>
				{pageIndex > 0 && (
					<Button type="submit" variant="outline" className="size-10" name="pageIndex" value={pageIndex - 1}>
						<ChevronLeft />
					</Button>
				)}
				{new Array(pageIndexMax + 1).fill(0).map((_, index) => (
					<Button
						key={index}
						type="submit"
						variant={index === pageIndex ? "default" : "outline"}
						disabled={index === pageIndex}
						name="pageIndex"
						value={index}
						className="size-10"
					>
						{index + 1}
					</Button>
				))}
				{pageIndex < pageIndexMax && (
					<Button type="submit" variant="outline" className="size-10" name="pageIndex" value={pageIndex + 1}>
						<ChevronRight />
					</Button>
				)}
			</Form>
		)
	}, [pageIndex, pageIndexMax])
	return (
		<>
			<Section>
				<SectionTitle className="font-bold text-lg">購入リクエスト一覧</SectionTitle>
				<div className="space-y-8">
					<Pagination />
					<div className="flex flex-col gap-4">
						{part.purchases.length > 0 ? (
							part.purchases.map((purchase) => <PurchaseBlock key={purchase.id} partId={part.id} purchase={purchase} />)
						) : (
							<div className="text-center text-muted-foreground">購入リクエストはありません</div>
						)}
					</div>
					<Pagination />
				</div>
			</Section>
		</>
	)
}

type PurchaseBlockProps = {
	purchase: Route.ComponentProps["loaderData"]["part"]["purchases"][number]
	partId: string
}

const PurchaseBlock = ({ purchase, partId }: PurchaseBlockProps) => {
	const [inProgress, TODOMessage] = useMemo(() => getPurchaseState(purchase), [purchase])
	return (
		<Link to={`/app/student/part/${partId}/purchase/${purchase.id}`} key={purchase.id}>
			<div className="p-6 border rounded-lg shadow space-y-2">
				<div>
					<div className="flex flex-row justify-between items-center gap-4">
						<h2 className="text-wrap">{purchase.label}</h2>
						<div className="text-lg font-semibold shrink-0">
							{formatMoney(purchase.items.reduce((acc, item) => acc + item.quantity * item.product.price, 0))}
						</div>
					</div>
				</div>
				<div>
					<div className="grid grid-cols-1 gap-2 desk:grid-cols-2 sm:grid-cols-3">
						{purchase.items.map((item) => (
							<PurchaseItem key={item.id} item={item} />
						))}
					</div>
				</div>
				{inProgress ? (
					<div className="inline-flex items-center gap-1 text-muted-foreground">
						<Flag size={16} />
						<span className="text-sm">{TODOMessage}</span>
					</div>
				) : (
					<div className="inline-flex items-center gap-1 text-destructive">
						<AlertCircle size={16} />
						<span className="text-sm">{TODOMessage}</span>
					</div>
				)}
			</div>
		</Link>
	)
}

type PurchaseItemProps = {
	item: PurchaseBlockProps["purchase"]["items"][number]
}

const PurchaseItem = ({ item }: PurchaseItemProps) => {
	return (
		<div className="p-2 border rounded-md">
			<div className="flex flex-row justify-between items-center">
				<div>
					<div>{item.product.name}</div>
					<div className="text-sm text-muted-foreground w-auto">{formatMoney(item.product.price)}</div>
				</div>
				<div>{`×${item.quantity}`}</div>
			</div>
		</div>
	)
}
