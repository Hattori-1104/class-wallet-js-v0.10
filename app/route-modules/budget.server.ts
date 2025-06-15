import { getPartBudgetInfoRaw, getWalletBudgetInfoRaw } from "@prisma/client/sql"
import { prisma } from "~/services/repository.server"

// export async function queryPartBudgetInfo(partId: string) {
// 	const purchaseInProgressPromise = prisma.purchase.findMany({
// 		where: {
// 			part: { id: partId },
// 			receiptSubmission: null,
// 			canceled: false,
// 			NOT: {
// 				accountantApproval: { approved: false },
// 				teacherApproval: { approved: false },
// 			},
// 		},
// 		select: {
// 			plannedUsage: true,
// 		},
// 	})

// 	const purchaseCompletedPromise = prisma.purchase.findMany({
// 		where: {
// 			part: { id: partId },
// 			receiptSubmission: { isNot: null },
// 			canceled: false,
// 		},
// 		select: {
// 			completion: {
// 				select: {
// 					actualUsage: true,
// 				},
// 			},
// 		},
// 	})

// 	const [purchaseInProgress, purchaseCompleted] = await Promise.all([
// 		purchaseInProgressPromise,
// 		purchaseCompletedPromise,
// 	])

// 	const plannedUsage = purchaseInProgress.reduce((acc, purchase) => acc + purchase.plannedUsage, 0)
// 	const actualUsage = purchaseCompleted.reduce((acc, purchase) => acc + purchase.completion!.actualUsage, 0)

// 	return { plannedUsage, actualUsage }
// }

export async function queryPartBudgetInfo(partId: string) {
	const [result] = await prisma.$queryRawTyped(getPartBudgetInfoRaw(partId))
	return { plannedUsage: result.plannedUsage.toNumber(), actualUsage: result.actualUsage.toNumber() }
}

export async function queryWalletBudgetInfo(walletId: string) {
	const result = await prisma.$queryRawTyped(getWalletBudgetInfoRaw(walletId))
	const partsBudgetInfo = result.map((line) => ({
		id: line.partId,
		budget: line.partBudget,
		plannedUsage: line.plannedUsage.toNumber(),
		actualUsage: line.actualUsage.toNumber(),
	}))
	const walletBudgetInfo = {
		id: result[0].walletId,
		plannedUsage: partsBudgetInfo.reduce((sum, part) => sum + part.plannedUsage, 0),
		actualUsage: partsBudgetInfo.reduce((sum, part) => sum + part.actualUsage, 0),
	}
	return { walletBudgetInfo, partsBudgetInfo }
}
