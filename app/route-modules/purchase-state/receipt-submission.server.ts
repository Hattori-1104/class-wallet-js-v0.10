import type { Prisma } from "@prisma/client"

export const PurchaseReceiptSubmissionSelectQuery = {
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
	receiptSubmission: {
		select: {
			at: true,
			submittedTo: true,
			receiptIndex: true,
		},
	},
} satisfies Prisma.PurchaseSelect

export type PurchaseReceiptSubmissionSelectQuery =
	typeof PurchaseReceiptSubmissionSelectQuery
