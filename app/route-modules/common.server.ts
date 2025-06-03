import { prisma } from "../services/repository.server"
import {
	type SessionStorage,
	errorBuilder,
	requireSession,
} from "../services/session.server"

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
 * @returns {Promise<{student: Student, session: SessionStorage, partId: string | null}>}
 *
 * @db 無し
 * @session 無し
 */
type User = {
	id: string
	name: string
	email: string
}
export async function entryStudentRoute(
	request: Request,
	paramPartId: string | undefined,
	redirect: false,
): Promise<{ student: User; session: SessionStorage; partId: string | null }>
export async function entryStudentRoute(
	request: Request,
	paramPartId: string | undefined,
	redirect?: true,
): Promise<{ student: User; session: SessionStorage; partId: string }>
export async function entryStudentRoute(
	request: Request,
	paramPartId: string | undefined,
	redirect = true,
): Promise<{ student: User; session: SessionStorage; partId: string | null }> {
	// セッション情報の取得 & 検証
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	const partId = await requirePartId(paramPartId, student.id)
	if (!partId && redirect) {
		const errorRedirect = errorBuilder(`/app/student/part/${partId}`, session)
		throw await errorRedirect("パートに所属していません。")
	}
	return { student, session, partId }
}

/**
 * 生徒を検証する
 * @param {SessionStorage} session
 * @returns {Promise<Student>}
 *
 * @query 1
 */
export async function verifyStudent(session: SessionStorage) {
	const user = session.get("user")
	const errorRedirect = errorBuilder("/app/auth", session)

	// セッションの検証
	if (!user) throw await errorRedirect("ログインしていません。")
	if (user.type !== "student") throw await errorRedirect("生徒ではありません。")

	// データベースの検証
	const student = await prisma.student.findUnique({ where: { id: user.id } })
	if (!student) {
		session.unset("user")
		throw await errorRedirect("生徒が見つかりません。")
	}
	return student
}

export async function requireWalletId(
	walletId: string | undefined,
	teacherId: string,
) {
	if (walletId) {
		const wallet = await prisma.wallet.findUnique({
			where: { id: walletId, teachers: { some: { id: teacherId } } },
		})
		if (wallet) return wallet.id
	}
	const wallet = await prisma.wallet.findFirst({
		where: { teachers: { some: { id: teacherId } } },
	})
	if (wallet) return wallet.id
	return null
}

/**
 * 教師を検証する
 * @param {SessionStorage} session
 * @returns {Promise<Teacher>}
 *
 * @query 1
 */
export async function verifyTeacher(session: SessionStorage) {
	const user = session.get("user")
	const errorRedirect = errorBuilder("/app/auth", session)

	if (!user) throw await errorRedirect("ログインしていません。")
	if (user.type !== "teacher") throw await errorRedirect("教師ではありません。")

	const teacher = await prisma.teacher.findUnique({ where: { id: user.id } })
	if (!teacher) {
		session.unset("user")
		throw await errorRedirect("教師が見つかりません。")
	}
	return teacher
}

export async function entryTeacherRoute(
	request: Request,
	paramWalletId: string | undefined,
	redirect: false,
): Promise<{ teacher: User; session: SessionStorage; walletId: string | null }>
export async function entryTeacherRoute(
	request: Request,
	paramWalletId: string | undefined,
	redirect?: true,
): Promise<{ teacher: User; session: SessionStorage; walletId: string }>
export async function entryTeacherRoute(
	request: Request,
	paramWalletId: string | undefined,
	redirect = true,
) {
	const session = await requireSession(request)
	const teacher = await verifyTeacher(session)
	const walletId = await requireWalletId(paramWalletId, teacher.id)
	if (!walletId && redirect) {
		const errorRedirect = errorBuilder(
			`/app/teacher/wallet/${walletId}`,
			session,
		)
		throw await errorRedirect("ウォレットが見つかりません。")
	}
	return { teacher, session, walletId }
}
