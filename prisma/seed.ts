import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
	await prisma.event.create({
		data: {
			id: process.env.EVENT_ID,
			name: "2025西高祭",
			wallets: {
				create: {
					name: "1-1",
					budget: 80000,
					teachers: {
						create: {
							id: "dev-teacher",
							name: "テスト教師",
							email: "test@example.com",
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
									id: "dev-student",
								},
							},
							leaders: {
								connect: {
									id: "dev-teacher",
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
