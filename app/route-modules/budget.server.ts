import { prisma } from "~/services/repository.server"

export async function queryPartBudgetInfo(partId: string) {
	const purchaseInProgressPromise = prisma.purchase.findMany({
		where: {
			part: { id: partId },
			receiptSubmission: null,
			canceled: false,
			NOT: {
				accountantApproval: { approved: false },
				teacherApproval: { approved: false },
			},
		},
		select: {
			plannedUsage: true,
		},
	})

	const purchaseCompletedPromise = prisma.purchase.findMany({
		where: {
			part: { id: partId },
			receiptSubmission: { isNot: null },
			canceled: false,
		},
		select: {
			completion: {
				select: {
					actualUsage: true,
				},
			},
		},
	})

	const [purchaseInProgress, purchaseCompleted] = await Promise.all([
		purchaseInProgressPromise,
		purchaseCompletedPromise,
	])

	const plannedUsage = purchaseInProgress.reduce(
		(acc, purchase) => acc + purchase.plannedUsage,
		0,
	)
	const actualUsage = purchaseCompleted.reduce(
		(acc, purchase) => acc + purchase.completion!.actualUsage,
		0,
	)

	return { plannedUsage, actualUsage }
}
