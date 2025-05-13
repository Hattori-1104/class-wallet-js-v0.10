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

export type SessionType = Session<SessionDataType, SessionFlashDataType>

export const requireSession = async (request: Request) =>
	getSession(request.headers.get("Cookie"))

/**
 * @deprecated errorBuilderで置き換え
 */
export const _createErrorRedirect =
	(session: Session, redirectUrl = "./") =>
	(message: string, redirectUrlOverride?: string) => ({
		catch() {
			return async (error: unknown) => {
				session.flash("error", { message })
				console.error(error)
				throw redirect(redirectUrlOverride ?? redirectUrl, {
					headers: { "Set-Cookie": await commitSession(session) },
				})
			}
		},
		async throw() {
			session.flash("error", { message })
			return redirect(redirectUrlOverride ?? redirectUrl, {
				headers: { "Set-Cookie": await commitSession(session) },
			})
		},
	})

/**
 * @deprecated errorBuilderで置き換え
 */
export const _createSuccessRedirect =
	(session: Session, redirectUrl = "./") =>
	async (message: string, redirectUrlOverride?: string) => {
		session.flash("success", { message })
		throw redirect(redirectUrlOverride ?? redirectUrl, {
			headers: { "Set-Cookie": await commitSession(session) },
		})
	}
/**
 * @deprecated
 */
export const _userNotFoundRedirect = async (session: Session) => {
	const errorRedirect = _createErrorRedirect(session, "/app/auth")
	return await errorRedirect("ユーザーが見つかりません。").throw()
}

const stripOrigin = (url: URL) => url.pathname + url.search + url.hash

export function errorBuilder(redirectUrl: string) {
	return (
		errorMessage: string,
		options?: { redirectUrlOverride?: string } & Parameters<typeof redirect>[1],
	) => {
		const url = new URL(
			options?.redirectUrlOverride ?? redirectUrl,
			"http://localhost",
		)
		url.searchParams.set("error", encodeURIComponent(errorMessage))
		throw redirect(stripOrigin(url), options)
	}
}

export function successBuilder(redirectUrl: string) {
	return (
		message: string,
		options?: { redirectUrlOverride?: string } & Parameters<typeof redirect>[1],
	) => {
		const url = new URL(
			options?.redirectUrlOverride ?? redirectUrl,
			"http://localhost",
		)
		url.searchParams.set("success", encodeURIComponent(message))
		return redirect(stripOrigin(url), options)
	}
}
