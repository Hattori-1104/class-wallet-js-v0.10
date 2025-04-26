import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
	await prisma.product.create({
		data: {
			name: "テスト商品",
			price: 1000,
		},
	})
	await prisma.event.create({
		data: {
			name: "テストイベント",
			wallets: {
				create: {
					name: "テストウォレット",
					budget: 10000,
					teachers: {
						create: {
							id: "dev-teacher",
							name: "テスト教師",
							email: "test@example.com",
						},
					},
					parts: {
						create: {
							name: "テストパート",
							students: {
								create: {
									id: "dev-student",
									name: "テスト学生",
									email: "test@example.com",
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
