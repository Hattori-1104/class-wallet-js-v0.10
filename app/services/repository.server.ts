import { PrismaClient } from "@prisma/client"
import { type Session, redirect } from "react-router"
import { commitSession } from "~/services/session.server"

export const prisma = new PrismaClient()

export const errorRedirect =
	(session: Session, redirectUrl = "/auth", message = "エラーが発生しました。") =>
	async (error: unknown) => {
		session.flash("error", { message })
		console.error(error)
		throw redirect(redirectUrl, { headers: { "Set-Cookie": await commitSession(session) } })
	}

export const successRedirect = async (session: Session, redirectUrl = "./", message = "成功しました。") => {
	session.flash("success", { message })
	throw redirect(redirectUrl, { headers: { "Set-Cookie": await commitSession(session) } })
}
