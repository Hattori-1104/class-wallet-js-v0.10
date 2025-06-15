import type { Prisma } from "@prisma/client"
import { prisma } from "~/services/repository.server"
import { buildErrorRedirect, requireSession } from "~/services/session.server"

// ユーザー情報 +α の情報とセッションのみを返す
// パート情報などは大きく取得しない

const baseStudentSelect = {
	id: true,
	name: true,
	email: true,
} satisfies Prisma.StudentSelectScalar

const basePartSelect = {
	id: true,
	name: true,
} satisfies Prisma.PartSelectScalar

const baseWalletSelect = {
	id: true,
	name: true,
} satisfies Prisma.WalletSelectScalar

export async function entryStudentPlusPart(request: Request, paramPartId?: string) {
	const session = await requireSession(request)
	const errorRedirect = buildErrorRedirect("/app/auth", session)

	const sessionUser = session.get("user")
	if (sessionUser?.type !== "student") throw await errorRedirect("生徒としてログインしてください。")

	const studentId = sessionUser.id

	const student = await prisma.student.findFirst({
		where: { id: studentId },
		select: {
			...baseStudentSelect,
			parts: { select: basePartSelect, where: { id: paramPartId } },
		},
	})
	if (!student) throw await errorRedirect("生徒アカウントが見つかりません。")

	const studentWithBaseInfo = { id: student.id, name: student.name, email: student.email }

	if (student.parts.length === 0) return { student: studentWithBaseInfo, partId: null, session }
	return { student: studentWithBaseInfo, partId: paramPartId ?? null, session }
}

export async function entryStudentPlusWallet(request: Request, paramPartId?: string) {
	const session = await requireSession(request)
	const errorRedirect = buildErrorRedirect("/app/auth", session)

	const sessionUser = session.get("user")
	if (sessionUser?.type !== "student") throw await errorRedirect("生徒としてログインしてください。")

	const studentId = sessionUser.id
	const student = await prisma.student.findFirst({
		where: { id: studentId },
		select: {
			...baseStudentSelect,
			wallets: { select: baseWalletSelect, where: { accountantStudents: { some: { id: studentId } } } },
			parts: { select: { wallet: { select: baseWalletSelect } }, where: { id: paramPartId } },
		},
	})
	if (!student) throw await errorRedirect("生徒アカウントが見つかりません。")

	const studentWithBaseInfo = { id: student.id, name: student.name, email: student.email }

	const isAccountant = student.wallets.length > 0

	if (isAccountant) return { student: studentWithBaseInfo, walletId: student.wallets[0].id, isAccountant, session }

	if (!student.parts[0].wallet) return { student: studentWithBaseInfo, walletId: null, session }
	return { student: studentWithBaseInfo, walletId: student.parts[0].wallet.id, session }
}
