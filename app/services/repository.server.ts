import { PrismaClient } from "@prisma/client"
import { redirect } from "react-router"
import { commitSession, getSession } from "~/services/session.server"

export const prisma = new PrismaClient()

export const errorRedirect =
	(request: Request, redirectUrl = "/auth", message = "エラーが発生しました。") =>
	async (error: unknown) => {
		const session = await getSession(request.headers.get("Cookie"))
		session.flash("error", { message })
		console.error(error)
		throw redirect(redirectUrl, { headers: { "Set-Cookie": await commitSession(session) } })
	}

export const successRedirect = async (request: Request, redirectUrl = "./", message = "成功しました。") => {
	const session = await getSession(request.headers.get("Cookie"))
	session.flash("success", { message })
	throw redirect(redirectUrl, { headers: { "Set-Cookie": await commitSession(session) } })
}
