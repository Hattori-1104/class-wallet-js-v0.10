import { PrismaClient } from "@prisma/client"
import { type Session, redirect } from "react-router"
import { commitSession } from "~/services/session.server"

export const prisma = new PrismaClient()

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
