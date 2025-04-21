import { BellRing, LogOut } from "lucide-react"
import { Form, Outlet, useFetcher } from "react-router"
import { Header } from "~/components/common/header"
import { Button } from "~/components/ui/button"
import { urlBase64ToUint8Array } from "~/utilities/calc"
import type { Route } from "./+types/layout"

export const loader = async () => {
	const PUBLIC_KEY = "BHrgHt3vDyxOda3-nAHDJ8uBpR7_YUmpAIuUMNMZPddQr13Lrjt7Pf25_E3DFUuSo0KGYDtZxVLEF5r0CW1pcrw"
	return { PUBLIC_KEY }
}

export default ({ loaderData: { PUBLIC_KEY } }: Route.ComponentProps) => {
	const fetcher = useFetcher()
	const handleClick = async () => {
		const registration = await navigator.serviceWorker.ready
		const permission = await Notification.requestPermission()
		if (permission === "granted") {
			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
			})
			fetcher.submit(
				{ subscription: JSON.stringify(subscription) },
				{
					method: "POST",
					action: "/app/student/layout",
				},
			)
		}
	}
	return (
		<>
			<Header>
				<Button variant={"ghost"} className="size-12" asChild onClick={handleClick}>
					<BellRing />
				</Button>
				<Form method={"POST"} action="/auth?logout">
					<Button type={"submit"} variant={"ghost"} className="size-12">
						<LogOut />
					</Button>
				</Form>
			</Header>
			<Outlet />
		</>
	)
}

export const action = async ({ request }: Route.ActionArgs) => {
	const body = await request.json()
	console.log(body)
	return null
}
