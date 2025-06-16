import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()

export function createUnknownUser() {
	return Promise.all([
		prisma.student.upsert({
			where: { id: "unknown" },
			update: { id: "unknown", name: "unknown", email: "unknown" },
			create: { id: "unknown", name: "unknown", email: "unknown" },
		}),
		prisma.teacher.upsert({
			where: { id: "unknown" },
			update: { id: "unknown", name: "unknown", email: "unknown" },
			create: { id: "unknown", name: "unknown", email: "unknown" },
		}),
	])
}
