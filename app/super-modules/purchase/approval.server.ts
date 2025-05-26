import type { Prisma } from "@prisma/client"

export const PurchaseApprovalSelectQuery = {
	id: true,
	label: true,
	canceled: true,
	accountantApproval: {
		select: {
			by: {
				select: {
					name: true,
				},
			},
			at: true,
			approved: true,
		},
	},
	teacherApproval: {
		select: {
			by: {
				select: {
					name: true,
				},
			},
			at: true,
			approved: true,
		},
	},
} satisfies Prisma.PurchaseSelect
export type PurchaseApprovalSelectQuery = typeof PurchaseApprovalSelectQuery
