import { type Prisma, PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()

export const partWithUserWhereQuery = (partId: string, userId: string) =>
	({
		id: partId,
		students: {
			some: {
				id: userId,
			},
		},
	}) satisfies Prisma.PartWhereInput

export const walletWithAccountantWhereQuery = (walletId: string, userId: string) =>
	({
		id: walletId,
		accountantStudents: {
			some: {
				id: userId,
			},
		},
	}) satisfies Prisma.WalletWhereInput

export const purchaseStateCompletedWhereQuery = () =>
	({
		NOT: {
			accountantApproval: { approved: true },
			teacherApproval: { approved: true },
			givenMoney: { isNot: null },
			usageReport: { isNot: null },
			receiptSubmission: { isNot: null },
			fishingReturned: { isNot: null },
		},
	}) satisfies Prisma.PurchaseStateWhereInput

// 拒否されていない & 未完了
export const purchaseStateInProgressWhereQuery = () =>
	({
		request: { approved: true },
		accountantApproval: { isNot: { approved: false } },
		teacherApproval: { isNot: { approved: false } },
		...purchaseStateCompletedWhereQuery(),
	}) satisfies Prisma.PurchaseStateWhereInput
