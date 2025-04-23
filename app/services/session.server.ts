import { type Session, createCookieSessionStorage, redirect } from "react-router"
import { z } from "zod"
import { prisma } from "~/services/repository.server"

const sessionDataSchema = z.object({
	user: z.object({
		id: z.string(),
		type: z.enum(["student", "teacher"]),
	}),
	tempUserType: z.enum(["student", "teacher"]).optional(),
	oauthState: z.string().optional(),
	inviteUrl: z.string().url().optional(),
})

const sessionFlashSchema = z.object({
	error: z
		.object({
			message: z.string(),
		})
		.optional(),
	success: z
		.object({
			message: z.string(),
		})
		.optional(),
})

type SessionDataType = z.infer<typeof sessionDataSchema>
type SessionFlashDataType = z.infer<typeof sessionFlashSchema>

const sessionStorage = createCookieSessionStorage<SessionDataType, SessionFlashDataType>({
	cookie: {
		name: "__session",
		httpOnly: true,
		path: "/",
		secrets: [process.env.SESSION_SECRET || "s3cr3t"],
		secure: process.env.NODE_ENV === "production",
		maxAge: 60 * 60 * 24 * 30,
	},
})

export const { getSession, commitSession, destroySession } = sessionStorage

export type SessionType = Session<SessionDataType, SessionFlashDataType>

export const requireSession = async (request: Request) => getSession(request.headers.get("Cookie"))

export const verifyStudent = async (session: SessionType) => {
	const user = session.get("user")
	const errorRedirect = createErrorRedirect(session, "/auth")
	if (!user) throw await errorRedirect("ユーザーが見つかりません。").throw()
	if (user.type !== "student") throw await errorRedirect("生徒ではありません。").throw()
	const student = await prisma.student.findUniqueOrThrow({ where: { id: user.id } }).catch(errorRedirect("生徒が見つかりません。").catch())
	return student.id
}

export const verifyTeacher = async (session: SessionType) => {
	const user = session.get("user")
	const errorRedirect = createErrorRedirect(session, "/auth")
	if (!user) throw await errorRedirect("ユーザーが見つかりません。").throw()
	if (user.type !== "teacher") throw await errorRedirect("教師ではありません。").throw()
	const teacher = await prisma.teacher.findUniqueOrThrow({ where: { id: user.id } }).catch(errorRedirect("教師が見つかりません。").catch())
	return teacher.id
}

export const verifyUser = async (session: SessionType): Promise<{ type: "student" | "teacher"; id: string }> => {
	const user = session.get("user")
	const errorRedirect = createErrorRedirect(session, "/auth")
	if (!user) throw await errorRedirect("ユーザーが見つかりません。").throw()
	if (user.type === "student") {
		return { type: "student", id: await verifyStudent(session) }
	}
	if (user.type === "teacher") {
		return { type: "teacher", id: await verifyTeacher(session) }
	}
	throw await errorRedirect("ユーザーが見つかりません。").throw()
}

// 本番の権限を持つ先生と生徒を追加
// ここは変更必須
export const verifyAdmin = async (session: SessionType) => {
	const user = session.get("user")
	const errorRedirect = createErrorRedirect(session, "/auth")
	if (!user) throw await errorRedirect("ユーザーが見つかりません。").throw()
	if (user.type === "student") {
		if (user.id === "dev-student" && process.env.NODE_ENV === "development") return { type: "student", id: user.id }
	}
	if (user.type === "teacher") {
		if (user.id === "dev-teacher" && process.env.NODE_ENV === "development") return { type: "teacher", id: user.id }
	}
	throw await errorRedirect("ユーザーが見つかりません。").throw()
}

export const createErrorRedirect =
	(session: Session, redirectUrl = "./") =>
	(message: string, redirectUrlOverride?: string) => ({
		catch() {
			return async (error: unknown) => {
				session.flash("error", { message })
				console.error(error)
				throw redirect(redirectUrlOverride ?? redirectUrl, { headers: { "Set-Cookie": await commitSession(session) } })
			}
		},
		async throw() {
			session.flash("error", { message })
			return redirect(redirectUrlOverride ?? redirectUrl, { headers: { "Set-Cookie": await commitSession(session) } })
		},
	})

export const createSuccessRedirect =
	(session: Session, redirectUrl = "./") =>
	async (message: string, redirectUrlOverride?: string) => {
		session.flash("success", { message })
		throw redirect(redirectUrlOverride ?? redirectUrl, { headers: { "Set-Cookie": await commitSession(session) } })
	}

export const userNotFoundRedirect = async (session: Session) => {
	const errorRedirect = createErrorRedirect(session, "/auth")
	return await errorRedirect("ユーザーが見つかりません。").throw()
}
