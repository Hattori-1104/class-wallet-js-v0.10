import type { Prisma } from "@prisma/client"
import { prisma } from "~/services/repository.server"
import { buildErrorRedirect, requireSession } from "~/services/session.server"
import { requirePartId, verifyStudent } from "./common.server"

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

export async function entryStudentWallet(request: Request, paramPartId: string | undefined) {
	const session = await requireSession(request)
	const errorRedirect = buildErrorRedirect("/app/student", session)
	const student = await verifyStudent(session)
	const partId = await requirePartId(paramPartId, student.id)
	if (!partId) throw await errorRedirect("パートに所属していません。")

	const { id: walletId } = await prisma.wallet
		.findFirstOrThrow({
			where: { parts: { some: { id: partId, students: { some: { id: student.id } } } } },
			select: { id: true },
		})
		.catch(() => errorRedirect("ウォレットに所属していません。"))
	return { session, student, walletId, partId }
}
