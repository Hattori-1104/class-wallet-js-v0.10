import { LogOut } from "lucide-react"
import { Form, Outlet } from "react-router"
import { Header } from "~/components/common/header"
import { Button } from "~/components/ui/button"

export default () => {
	return (
		<>
			<Header>
				<Form method={"POST"} action="/auth?logout">
					<Button type={"submit"} variant={"outline"} size={"icon"}>
						<LogOut />
					</Button>
				</Form>
			</Header>
			<Outlet />
		</>
	)
}
