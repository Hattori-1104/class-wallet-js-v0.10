import type { Prisma } from "@prisma/client"

export function computePlannedUsage(
	purchase: Prisma.PurchaseGetPayload<{
		select: {
			items: {
				select: {
					quantity: true
					product: {
						select: {
							price: true
						}
					}
				}
			}
		}
	}>,
) {
	return purchase.items.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
}
