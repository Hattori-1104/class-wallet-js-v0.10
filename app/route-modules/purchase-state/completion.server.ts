import type { Prisma } from "@prisma/client"

export const PurchaseCompletionSelectQuery = {
	id: true,
	label: true,
	canceled: true,
	requestedBy: {
		select: {
			name: true,
		},
	},
	completion: {
		select: {
			actualUsage: true,
			at: true,
		},
	},
	accountantApproval: {
		select: {
			approved: true,
		},
	},
	teacherApproval: {
		select: {
			approved: true,
		},
	},
} satisfies Prisma.PurchaseSelect
export type PurchaseCompletionSelectQuery = typeof PurchaseCompletionSelectQuery
