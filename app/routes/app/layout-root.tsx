import { useEffect } from "react"
import { Outlet, data } from "react-router"
import { toast } from "sonner"
import { Toaster } from "~/components/ui/sonner"
import { commitSession, requireSession } from "~/services/session.server"
import type { Route } from "./+types/layout-root"

// エラー・サクセスメッセージの受け取り
// Session flashで実装
export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const errorObject = session.get("error")
	const successObject = session.get("success")
	return data({ errorObject, successObject }, { headers: { "Set-Cookie": await commitSession(session) } })
}

export default ({ loaderData: { errorObject, successObject } }: Route.ComponentProps) => {
	useEffect(() => {
		if (errorObject) {
			toast.error(errorObject.message, { position: "top-right" })
		}
		if (successObject) {
			toast.success(successObject.message, { position: "top-right" })
		}
	}, [errorObject, successObject])
	return (
		<>
			<Toaster />
			<Outlet />
		</>
	)
}
