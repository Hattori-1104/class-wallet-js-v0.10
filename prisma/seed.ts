import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

const student = await prisma.student.create({
	data: {
		id: "105926552011320383379",
		name: "テスト生徒",
		email: "z20230423@west.ed.jp",
	},
})

const teacher = await prisma.teacher.create({
	data: {
		id: "105926552011320383379",
		name: "テスト教師",
		email: "z20230423@west.ed.jp",
	},
})

await prisma.event.create({
	data: {
		name: "2025西高祭",
		wallets: {
			create: [
				{
					name: "1-1",
					budget: 1000,
					parts: {
						create: [
							{
								name: "展示",
								budget: 500,
								students: { connect: { id: student.id } },
								leaders: { connect: { id: student.id } },
							},
							{ name: "行燈", budget: 500, students: { connect: { id: student.id } } },
						],
					},
					accountantStudents: {
						connect: {
							id: student.id,
						},
					},
					teachers: {
						connect: {
							id: teacher.id,
						},
					},
				},
				{ name: "1-2", budget: 1000 },
			],
		},
	},
})
