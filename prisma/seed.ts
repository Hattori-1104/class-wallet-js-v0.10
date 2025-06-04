import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
	const teacher = await prisma.teacher.upsert({
		where: {
			id: "dev-teacher",
		},
		update: {
			name: "テスト教師",
			email: "test@example.com",
		},
		create: {
			id: "dev-teacher",
			name: "テスト教師",
			email: "test@example.com",
		},
		select: {
			id: true,
		},
	})
	const student = await prisma.student.upsert({
		where: {
			id: "dev-student",
		},
		update: {
			name: "テスト学生",
			email: "test@example.com",
			admin: true,
		},
		create: {
			id: "dev-student",
			name: "テスト学生",
			email: "test@example.com",
			admin: true,
		},
		select: {
			id: true,
		},
	})
	await prisma.event.upsert({
		where: {
			id: "nishikosai2025",
		},
		update: {
			name: "西校祭2025",
		},
		create: {
			id: "nishikosai2025",
			name: "西校祭2025",
		},
	})
}

await main()
