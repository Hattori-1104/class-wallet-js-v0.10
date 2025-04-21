import { ChevronLeft, LogOut } from "lucide-react"
import { Form, Outlet, useNavigate } from "react-router"
import { Header } from "~/components/common/header"
import { Button } from "~/components/ui/button"

export default () => {
	const navigate = useNavigate()
	return (
		<>
			<Header>
				<Button variant={"ghost"} className="size-12" onClick={() => navigate(-1)}>
					<ChevronLeft />
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
