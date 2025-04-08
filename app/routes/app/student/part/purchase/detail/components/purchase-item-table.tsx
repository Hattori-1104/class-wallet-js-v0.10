import type { Prisma } from "@prisma/client"
import { useMemo } from "react"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { getPurchasePlannedUsage } from "~/utilities/calc"
import { formatMoney } from "~/utilities/display"

type PurchaseItemTableProps = {
	purchase: Prisma.PurchaseGetPayload<{
		select: {
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
	}>
}

export const PurchaseItemTable = ({ purchase }: PurchaseItemTableProps) => {
	const totalPrice = useMemo(() => getPurchasePlannedUsage(purchase), [purchase])
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="">商品名</TableHead>
					<TableHead className="text-right">数量</TableHead>
					<TableHead className="text-right">推定単価</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{purchase.items.map((item) => (
					<TableRow key={item.id}>
						<TableCell>{item.product.name}</TableCell>
						<TableCell className="text-right">× {item.quantity}</TableCell>
						<TableCell className="text-right">{formatMoney(item.product.price)}</TableCell>
					</TableRow>
				))}
			</TableBody>
			<TableFooter>
				<TableRow>
					<TableCell colSpan={2}>合計使用予定額</TableCell>
					<TableCell className="text-right">{formatMoney(totalPrice)}</TableCell>
				</TableRow>
			</TableFooter>
		</Table>
	)
}
