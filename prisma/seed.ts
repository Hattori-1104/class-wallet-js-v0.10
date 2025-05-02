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
				},
			},
		},
	})
}

await main()
