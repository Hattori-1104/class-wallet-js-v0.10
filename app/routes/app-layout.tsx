import { useEffect } from "react"
import { Outlet, data } from "react-router"
import { toast } from "sonner"
import { Toaster } from "~/components/ui/sonner"
import { commitSession, getSession } from "~/services/session.server"
import type { Route } from "./+types/app-layout"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const errorFlash = session.get("error")
	const successFlash = session.get("success")
	return data({ errorFlash, successFlash }, { headers: { "Set-Cookie": await commitSession(session) } })
}

export default ({ loaderData: { errorFlash, successFlash } }: Route.ComponentProps) => {
	useEffect(() => {
		if (errorFlash) {
			toast.error(errorFlash.message)
		}
		if (successFlash) {
			toast.success(successFlash.message)
		}
	})

	return (
		<>
			<Toaster />
			<div className="absolute inset-0 bg-zinc-50 flex flex-col">
				<Outlet />
			</div>
		</>
	)
}
