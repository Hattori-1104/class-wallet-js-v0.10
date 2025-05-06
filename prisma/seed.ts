import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
	const teacher = await prisma.teacher.create({
		data: {
			id: "dev-teacher",
			name: "テスト教師",
			email: "test@example.com",
		},
		select: {
			id: true,
		},
	})
	const student = await prisma.student.create({
		data: {
			id: "dev-student",
			name: "テスト学生",
			email: "test@example.com",
		},
		select: {
			id: true,
		},
	})
	console.log({ eventId: process.env.EVENT_ID })
	await prisma.event.create({
		data: {
			id: process.env.EVENT_ID,
			name: "2025西高祭",
			wallets: {
				create: {
					name: "1-1",
					budget: 80000,
					teachers: {
						connect: {
							id: teacher.id,
						},
					},
					accountantStudents: {
						create: {
							id: "dev-student",
							name: "テスト学生",
							email: "test@example.com",
						},
					},
					parts: {
						create: {
							name: "展示",
							budget: 80000,
							students: {
								connect: {
									id: student.id,
								},
							},
							leaders: {
								connect: {
									id: student.id,
								},
							},
						},
					},
				},
			},
		},
	})
}

await main()
