import { type Prisma, PrismaClient, type PurchaseState } from "@prisma/client"
import _ from "lodash"

export const prisma = new PrismaClient().$extends({})

export const partWithUserWhereQuery = (partId: string, userId: string) =>
	({
		id: partId,
		students: {
			some: {
				id: userId,
			},
		},
	}) satisfies Prisma.PartWhereInput
export const partWithPurchaseWhereQuery = (partId: string, purchaseId: string) =>
	({
		id: partId,
		purchases: {
			some: {
				id: purchaseId,
			},
		},
	}) satisfies Prisma.PartWhereInput
export const partPersonInChargeSelectQuery = (query: Prisma.PartSelect = {}) =>
	_.merge<Prisma.PartSelect, Prisma.PartSelect>(query, {
		leaders: {
			select: {
				id: true,
				name: true,
			},
		},
		wallet: {
			select: {
				accountantStudents: {
					select: {
						id: true,
						name: true,
					},
				},
				teachers: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		},
	})
export const walletWithAccountantWhereQuery = (walletId: string, userId: string) =>
	({
		id: walletId,
		accountantStudents: {
			some: {
				id: userId,
			},
		},
	}) satisfies Prisma.WalletWhereInput

export const purchaseStateSelectQuery = () =>
	({
		requests: {
			orderBy: {
				at: "desc",
			},
			select: {
				approved: true,
				by: {
					select: {
						name: true,
					},
				},
				at: true,
			},
		},
		accountantApprovals: {
			orderBy: {
				at: "desc",
			},
			select: {
				approved: true,
				by: {
					select: {
						name: true,
					},
				},
				at: true,
			},
		},
		teacherApprovals: {
			orderBy: {
				at: "desc",
			},
			select: {
				approved: true,
				by: {
					select: {
						name: true,
					},
				},
				at: true,
			},
		},
		givenMoneys: {
			orderBy: {
				at: "desc",
			},
			select: {
				amount: true,
				at: true,
			},
		},
		usageReports: {
			orderBy: {
				at: "desc",
			},
			select: {
				actualUsage: true,
				at: true,
			},
		},
		changeReturns: {
			orderBy: {
				at: "desc",
			},
			select: {
				at: true,
			},
		},
		receiptSubmissions: {
			orderBy: {
				at: "desc",
			},
			select: {
				at: true,
				receiptIndex: true,
			},
		},
	}) satisfies Prisma.PurchaseStateSelect
export const purchaseItemSelectQuery = () =>
	({
		id: true,
		quantity: true,
		product: {
			select: {
				id: true,
				name: true,
				price: true,
			},
		},
	}) satisfies Prisma.PurchaseItemSelect

export type PurchaseProcedure = keyof Omit<PurchaseState, "id">

export const queryIsBelonging = async (partId: string, userId: string) =>
	Boolean(
		await prisma.part.findUnique({ where: { id: partId, students: { some: { id: userId } } }, select: { id: true } }),
	)
export const queryIsLeader = async (partId: string, userId: string) =>
	Boolean(
		await prisma.part.findUnique({ where: { id: partId, leaders: { some: { id: userId } } }, select: { id: true } }),
	)
export const queryIsAccountant = async (walletId: string, userId: string) =>
	Boolean(
		await prisma.student.findUnique({
			where: { id: userId, wallets: { some: { id: walletId } } },
			select: { id: true },
		}),
	)
export const queryIsHomeroomTeacher = (walletId: string, teacherId: string) =>
	prisma.student.findUnique({ where: { id: teacherId, wallets: { some: { id: walletId } } }, select: { id: true } })
