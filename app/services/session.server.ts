import {
	type Session,
	createCookieSessionStorage,
	redirect,
} from "react-router"
import { z } from "zod"

const sessionDataSchema = z.object({
	user: z.object({
		type: z.enum(["student", "teacher"]),
		id: z.string(),
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

const sessionStorage = createCookieSessionStorage<
	SessionDataType,
	SessionFlashDataType
>({
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

export type SessionStorage = Session<SessionDataType, SessionFlashDataType>

export const requireSession = async (request: Request) =>
	getSession(request.headers.get("Cookie"))

export function buildErrorRedirect(
	redirectUrl: string,
	session: SessionStorage,
) {
	return async (errorMessage: string, redirectUrlOverride?: string) => {
		session.flash("error", { message: errorMessage })
		throw redirect(redirectUrlOverride ?? redirectUrl, {
			headers: { "Set-Cookie": await commitSession(session) },
		})
	}
}

export function buildSuccessRedirect(
	redirectUrl: string,
	session: SessionStorage,
) {
	return async (successMessage: string) => {
		session.flash("success", { message: successMessage })
		return redirect(redirectUrl, {
			headers: { "Set-Cookie": await commitSession(session) },
		})
	}
}
