import { prisma } from "./repository.server"
import {
	type SessionType,
	commitSession,
	errorBuilder,
	requireSession,
} from "./session.server"

/**
 * 指定されたpartIdが存在し、かつ学生が参加している場合はpartIdを返す
 * 存在しない場合は、学生が参加しているpartのうち、最も新しいpartを返す
 * 参加しているpartがない場合はnullを返す
 * @param {string | undefined} partId
 * @param {string} studentId
 * @returns {string | null}
 *
 * @query 1
 */

export async function requirePartId(
	partId: string | undefined,
	studentId: string,
) {
	if (partId) {
		const part = await prisma.part.findUnique({
			where: { id: partId, students: { some: { id: studentId } } },
		})
		if (part) return part.id
	}
	const part = await prisma.part.findFirst({
		where: { students: { some: { id: studentId } } },
	})
	if (part) return part.id
	return null
}

/**
 * パートIDを必要とするルートのローダーのエントリーポイント
 * セッション情報の取得 & 検証
 * パートIDの取得
 *
 * @param {Request} request
 * @param {string | undefined} paramPartId
 * @returns {Promise<{student: Student, session: SessionType, partId: string | null}>}
 *
 * @db 無し
 * @session 無し
 */
export async function entryPartRoute(
	request: Request,
	paramPartId: string | undefined,
) {
	// セッション情報の取得 & 検証
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	const partId = await requirePartId(paramPartId, student.id)
	return { student, session, partId }
}

/**
 * 生徒を検証する
 * @param {SessionType} session
 * @returns {Promise<Student>}
 *
 * @query 1
 */
export async function verifyStudent(session: SessionType) {
	const user = session.get("user")
	const errorRedirect = errorBuilder("/app/auth")

	// セッションの検証
	if (!user) throw errorRedirect("ログインしていません。")
	if (user.type !== "student") throw errorRedirect("生徒ではありません。")

	// データベースの検証
	const student = await prisma.student.findUnique({ where: { id: user.id } })
	if (!student) {
		session.unset("user")
		throw errorRedirect("生徒が見つかりません。", {
			headers: { "Set-Cookie": await commitSession(session) },
		})
	}
	return student
}
