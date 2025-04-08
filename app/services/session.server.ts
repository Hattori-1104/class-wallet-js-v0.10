import { createCookieSessionStorage, redirect } from "react-router"
import { z } from "zod"
import { prisma } from "~/services/repository.server"

const sessionDataSchema = z.object({
	user: z.object({
		id: z.string(),
		type: z.enum(["student", "teacher"]),
	}),
	tempUserType: z.enum(["student", "teacher"]).optional(),
	oauthState: z.string().optional(),
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

export const verifyStudent = async (request: Request) => {
	const session = await getSession(request.headers.get("Cookie"))
	const user = session.get("user")
	if (!user) throw redirect("/auth")
	if (user.type !== "student") throw redirect("/app/teacher")
	const student = await prisma.student.findUniqueOrThrow({ where: { id: user.id } }).catch((e) => e)
	if (student instanceof Error) throw redirect("/auth")
	return user.id
}

export const verifyTeacher = async (request: Request) => {
	const session = await getSession(request.headers.get("Cookie"))
	const user = session.get("user")
	if (!user) throw redirect("/auth")
	if (user.type !== "teacher") throw redirect("/app/student")
	const student = await prisma.teacher.findUniqueOrThrow({ where: { id: user.id } }).catch((e) => e)
	if (student instanceof Error) throw redirect("/auth")
	return user.id
}
