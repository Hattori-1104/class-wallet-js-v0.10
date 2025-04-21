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

type getPlannedUsageArgs = Prisma.PurchaseGetPayload<{
	select: {
		reportedAt: true
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
}>[]
export const getPlannedUsage = (purchases: getPlannedUsageArgs) =>
	purchases.reduce((acc, purchase) => (purchase.reportedAt ? acc : acc + getPurchasePlannedUsage(purchase)), 0)

type getActualUsageArgs = Prisma.PurchaseGetPayload<{
	select: {
		actualUsage: true
	}
}>[]
export const getActualUsage = (purchases: getActualUsageArgs) => purchases.reduce((acc, purchase) => acc + (purchase.actualUsage ?? 0), 0)

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
export const getPurchaseState = (purchase: getPurchaseStateArgs): [boolean, string, string] => {
	if (!purchase.requestCert.approved) return [false, "このリクエストは取り消されました。", "request-refused"]
	if (!purchase.accountantCert) return [true, "会計の承認待ちです。", "accountant-waiting"]
	if (!purchase.accountantCert.approved) return [false, "会計に拒否されました。", "accountant-refused"]
	if (!purchase.teacherCert) return [true, "教師の承認待ちです。", "teacher-waiting"]
	if (!purchase.teacherCert.approved) return [false, "教師に拒否されました。", "teacher-refused"]
	if (!purchase.actualUsage) return [true, "買い出しに行ってください。", "purchase-waiting"]
	if (!purchase.returnedAt && purchase.actualUsage !== getPurchasePlannedUsage(purchase)) return [true, "お釣りを教師へ返却してください。", "return-waiting"]
	return [true, "購入は完了しました。", "completed"]
}

type getWalletPlannedUsageArgs = Prisma.WalletGetPayload<{
	select: {
		parts: {
			select: {
				purchases: {
					select: {
						reportedAt: true
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
export const getWalletPlannedUsage = (wallet: getWalletPlannedUsageArgs) => wallet.parts.reduce((acc, part) => acc + getPlannedUsage(part.purchases), 0)

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
export const getWalletActualUsage = (wallet: getWalletActualUsageArgs) => wallet.parts.reduce((acc, part) => acc + getActualUsage(part.purchases), 0)

export const urlBase64ToUint8Array = (base64String: string) => {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
	const rawData = window.atob(base64)
	const outputArray = new Uint8Array(rawData.length)
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i)
	}
	return outputArray
}
