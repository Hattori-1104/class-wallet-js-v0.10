import type { Prisma } from "@prisma/client"
import { AlertCircle, Flag } from "lucide-react"
import { useMemo } from "react"
import { Link } from "react-router"
import { Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { Badge } from "~/components/ui/badge"
import { getPurchaseState } from "~/utilities/calc"
import { formatMoney } from "~/utilities/display"

type PurchaseSectionProps = {
	part: Prisma.PartGetPayload<{
		select: {
			id: true
			purchases: {
				select: {
					id: true
					label: true
					requestCert: {
						select: {
							signedBy: {
								select: {
									id: true
									name: true
								}
							}
							approved: true
						}
					}
					accountantCert: {
						select: {
							signedBy: {
								select: {
									id: true
									name: true
								}
							}
							approved: true
						}
					}
					teacherCert: {
						select: {
							signedBy: {
								select: {
									id: true
									name: true
								}
							}
							approved: true
						}
					}
					returnedAt: true
					completedAt: true
					actualUsage: true
					items: {
						select: {
							id: true
							quantity: true
							product: {
								select: {
									id: true
									name: true
									price: true
								}
							}
						}
					}
				}
			}
			_count: {
				select: {
					purchases: {
						where: {
							NOT: {
								OR: [
									{
										requestCert: {
											approved: false
										}
									},
									{
										teacherCert: {
											approved: false
										}
									},
									{
										accountantCert: {
											approved: false
										}
									},
								]
							}
						}
					}
				}
			}
		}
	}>
}

export const PurchaseSection = ({ part }: PurchaseSectionProps) => {
	const purchaseInProgress = part._count.purchases
	return (
		<Section>
			<SectionTitle className="flex flex-row items-center justify-between">
				<Title>進行中の購入リクエスト</Title>
				<Badge variant={"destructive"}>{purchaseInProgress}件</Badge>
			</SectionTitle>
			<div className="flex flex-col gap-4">
				{part.purchases.map((purchase) => (
					<PurchaseBlock key={purchase.id} purchase={purchase} />
				))}
			</div>
		</Section>
	)
}

type PurchaseBlockProps = {
	purchase: PurchaseSectionProps["part"]["purchases"][number]
}

export const PurchaseBlock = ({ purchase }: PurchaseBlockProps) => {
	const [inProgress, TODOMessage] = useMemo(() => getPurchaseState(purchase), [purchase])
	return (
		<Link to={`purchase/${purchase.id}`} key={purchase.id}>
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

export const PurchaseItem = ({ item }: PurchaseItemProps) => {
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
