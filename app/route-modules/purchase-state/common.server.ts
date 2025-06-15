import { IsRequesterRaw } from "@prisma/client/sql"
import { prisma } from "~/services/repository.server"

export const queryIsStudentInCharge = async (partId: string, studentId: string) =>
	Boolean(
		await prisma.part.findUnique({
			where: {
				id: partId,
				wallet: { accountantStudents: { some: { id: studentId } } },
			},
			select: {
				id: true,
			},
		}),
	)

export const queryIsRequester = async (purchaseId: string, studentId: string) =>
	Boolean((await prisma.$queryRawTyped(IsRequesterRaw(purchaseId, studentId)))[0].IsRequesterFlag)

export const queryCanStudentViewPurchase = async (purchaseId: string, studentId: string) =>
	Boolean(
		await prisma.purchase.findUnique({
			where: {
				id: purchaseId,
				part: { wallet: { parts: { some: { students: { some: { id: studentId } } } } } },
			},
			select: {
				id: true,
			},
		}),
	)
