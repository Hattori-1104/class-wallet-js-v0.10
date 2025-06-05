import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
	const adminId = process.env.ADMIN_GOOGLE_ID
	const adminName = process.env.ADMIN_NAME
	const adminEmail = process.env.ADMIN_EMAIL
	if (!adminId) throw new Error("ADMIN_ID is not set")
	if (!adminName) throw new Error("ADMIN_NAME is not set")
	if (!adminEmail) throw new Error("ADMIN_EMAIL is not set")
	const admin = await prisma.student.upsert({
		where: {
			id: adminId,
		},
		update: {
			name: adminName,
			email: adminEmail,
			admin: true,
		},
		create: {
			id: adminId,
			name: adminName,
			email: adminEmail,
			admin: true,
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
