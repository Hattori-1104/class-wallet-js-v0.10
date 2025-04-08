import type { Prisma } from "@prisma/client"

type getPurchasePlannedUsageArgs = Prisma.PurchaseGetPayload<{
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
}>
export const getPurchasePlannedUsage = (purchase: getPurchasePlannedUsageArgs) =>
	purchase.items.reduce((acc, item) => acc + item.product.price * item.quantity, 0)

type getPartPlannedUsageArgs = Prisma.PartGetPayload<{
	select: {
		purchases: {
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
		}
	}
}>
export const getPartPlannedUsage = (part: getPartPlannedUsageArgs) =>
	part.purchases.reduce((acc, purchase) => acc + getPurchasePlannedUsage(purchase), 0)

type getPartActualUsageArgs = Prisma.PartGetPayload<{
	select: {
		purchases: {
			select: {
				actualUsage: true
			}
		}
	}
}>
export const getPartActualUsage = (part: getPartActualUsageArgs) =>
	part.purchases.reduce((acc, purchase) => acc + (purchase.actualUsage ?? 0), 0)

type getPurchaseStateArgs = Prisma.PurchaseGetPayload<{
	select: {
		requestCert: {
			select: {
				approved: true
			}
		}
		accountantCert: {
			select: {
				approved: true
			}
		}
		teacherCert: {
			select: {
				approved: true
			}
		}
		actualUsage: true
		returnedAt: true
		completedAt: true
	}
}>
export const getPurchaseState = (purchase: getPurchaseStateArgs): [boolean, string] => {
	if (!purchase.requestCert.approved) return [false, "このリクエストは取り消されました。"]
	if (!purchase.accountantCert) return [true, "会計の承認待ちです。"]
	if (!purchase.accountantCert.approved) return [false, "会計に拒否されました。"]
	if (!purchase.teacherCert) return [true, "教師の承認待ちです。"]
	if (!purchase.teacherCert.approved) return [false, "教師に拒否されました。"]
	if (!purchase.actualUsage) return [true, "買い出しに行ってください。"]
	if (!purchase.returnedAt) return [true, "お釣りを教師へ返却してください。"]
	if (!purchase.completedAt) return [true, "購入の完了を確認してください"]
	return [true, "購入は完了しました。"]
}

type getWalletPlannedUsageArgs = Prisma.WalletGetPayload<{
	select: {
		parts: {
			select: {
				purchases: {
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
				}
			}
		}
	}
}>
export const getWalletPlannedUsage = (wallet: getWalletPlannedUsageArgs) =>
	wallet.parts.reduce((acc, part) => acc + getPartPlannedUsage(part), 0)

type getWalletActualUsageArgs = Prisma.WalletGetPayload<{
	select: {
		parts: {
			select: {
				purchases: {
					select: {
						actualUsage: true
					}
				}
			}
		}
	}
}>
export const getWalletActualUsage = (wallet: getWalletActualUsageArgs) =>
	wallet.parts.reduce((acc, part) => acc + getPartActualUsage(part), 0)
