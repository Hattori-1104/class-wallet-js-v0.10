import { Outlet } from "react-router"
import { Toaster } from "~/components/ui/sonner"

export default () => {
	return (
		<>
			<Toaster />
			<div className="absolute inset-0 bg-zinc-50 flex flex-col">
				<Outlet />
			</div>
		</>
	)
}
