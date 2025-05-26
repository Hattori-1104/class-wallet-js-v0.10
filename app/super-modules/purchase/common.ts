import { prisma } from "~/services/repository.server"

// Overloaded function signatures

export async function queryIsInCharge(
	query: StudentInChargeQuery,
): Promise<boolean>
export async function queryIsInCharge(
	query: TeacherInChargeQuery,
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
} // Discriminated union types for queryIsInCharge function

export type StudentInChargeQuery = {
	type: "student"
	partId: string
	studentId: string
}

export type TeacherInChargeQuery = {
	type: "teacher"
	walletId: string
	teacherId: string
}

export type InChargeQuery = StudentInChargeQuery | TeacherInChargeQuery
