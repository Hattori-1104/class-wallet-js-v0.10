import { prisma } from "~/services/repository.server"

// Discriminated union types for queryIsInCharge function

type StudentInChargeQuery = {
	type: "student"
	partId: string
	studentId: string
}

type TeacherInChargeQuery = {
	type: "teacher"
	walletId: string
	teacherId: string
}

type AccountantInChargeQuery = {
	type: "accountant"
	studentId: string
	id: { use: "part"; part: string } | { use: "wallet"; wallet: string }
}

type InChargeQuery =
	| StudentInChargeQuery
	| TeacherInChargeQuery
	| AccountantInChargeQuery

// Overloaded function signatures

export async function queryIsInCharge(
	query: StudentInChargeQuery,
): Promise<boolean>
export async function queryIsInCharge(
	query: TeacherInChargeQuery,
): Promise<boolean>
export async function queryIsInCharge(
	query: AccountantInChargeQuery,
): Promise<boolean>
export async function queryIsInCharge(query: InChargeQuery): Promise<boolean> {
	if (query.type === "student") {
		const student = await prisma.student.findUnique({
			where: {
				id: query.studentId,
				OR: [
					{
						parts: {
							some: {
								id: query.partId,
								leaders: { some: { id: query.studentId } },
							},
						},
					},
					{
						parts: {
							some: {
								id: query.partId,
								wallet: {
									accountantStudents: { some: { id: query.studentId } },
								},
							},
						},
					},
				],
			},
		})
		return Boolean(student)
	}

	if (query.type === "teacher") {
		const teacher = await prisma.teacher.findUnique({
			where: {
				id: query.teacherId,
				wallets: {
					some: {
						id: query.walletId,
					},
				},
			},
		})
		return Boolean(teacher)
	}

	if (query.type === "accountant") {
		if (query.id.use === "part") {
			const accountant = await prisma.student.findUnique({
				where: {
					id: query.studentId,
					parts: {
						some: {
							id: query.id.part,
							wallet: { accountantStudents: { some: { id: query.studentId } } },
						},
					},
				},
			})
			return Boolean(accountant)
		}
		if (query.id.use === "wallet") {
			const accountant = await prisma.student.findUnique({
				where: {
					id: query.studentId,
					parts: {
						some: {
							wallet: {
								id: query.id.wallet,
								accountantStudents: { some: { id: query.studentId } },
							},
						},
					},
				},
			})
			return Boolean(accountant)
		}
	}
	// exhaustive return
	return false
}

export async function queryIsRequester(purchaseId: string, studentId: string) {
	const purchase = await prisma.purchase.findUnique({
		where: {
			id: purchaseId,
			requestedBy: { id: studentId },
			part: { students: { some: { id: studentId } } },
		},
	})
	return Boolean(purchase)
}
