import { useEffect } from "react"
import { Outlet, useSearchParams } from "react-router"
import { toast } from "sonner"
import { Toaster } from "~/components/ui/sonner"
import type { Route } from "./+types/layout-root"

// エラー・サクセスメッセージの受け取り
export const loader = ({ request }: Route.LoaderArgs) => {
	const url = new URL(request.url)
	const searchParams = url.searchParams
	const errorMessage = decodeURIComponent(searchParams.get("error") ?? "")
	const successMessage = decodeURIComponent(searchParams.get("success") ?? "")

	return { errorMessage, successMessage }
}

export default ({
	loaderData: { errorMessage, successMessage },
}: Route.ComponentProps) => {
	const [, setSearchParams] = useSearchParams()
	useEffect(() => {
		if (errorMessage) {
			toast.error(errorMessage)
			setSearchParams((prev) => {
				prev.delete("error")
				return prev
			})
		}
		if (successMessage) {
			toast.success(successMessage)
			setSearchParams((prev) => {
				prev.delete("success")
				return prev
			})
		}
	}, [errorMessage, successMessage, setSearchParams])
	return (
		<>
			<Toaster />
			<Outlet />
		</>
	)
}
