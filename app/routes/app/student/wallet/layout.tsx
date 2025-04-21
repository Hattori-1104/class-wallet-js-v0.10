import { ChevronLeft, LogOut } from "lucide-react"
import { Form, Link, Outlet } from "react-router"
import { MainContainer } from "~/components/common/container"
import { Header } from "~/components/common/header"
import { Button } from "~/components/ui/button"
import type { Route } from "../+types/layout"

export default ({ params: { walletId } }: Route.ComponentProps) => {
	return (
		<>
			<Header>
				<Button variant={"ghost"} className="size-12" asChild>
					<Link to="/app/student">
						<ChevronLeft />
					</Link>
				</Button>
				<Form method={"POST"} action="/auth?logout">
					<Button type={"submit"} variant={"ghost"} className="size-12">
						<LogOut />
					</Button>
				</Form>
			</Header>
			<MainContainer>
				<Outlet />
			</MainContainer>
		</>
	)
}
