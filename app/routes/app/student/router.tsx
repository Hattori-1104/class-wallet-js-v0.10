import { redirect } from "react-router"
import type { Route } from "./+types/router"
export const loader = ({ request }: Route.LoaderArgs) => {
	const url = new URL(request.url)
	url.pathname = "/app/student/part"
	return redirect(url.toString())
}
