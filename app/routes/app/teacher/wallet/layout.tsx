import { ChevronLeft, Home, LogOut, Scroll, Users } from "lucide-react"
import { Form, Link, NavLink, Outlet } from "react-router"
import { MainContainer } from "~/components/common/container"
import { Header } from "~/components/common/header"
import { NavBar } from "~/components/common/navbar"
import { Button } from "~/components/ui/button"
import type { Route } from "./+types/layout"

export default ({ params: { walletId } }: Route.ComponentProps) => {
	return (
		<>
			<Header>
				<Button variant={"outline"} size={"icon"} asChild>
					<Link to="/app/teacher">
						<ChevronLeft />
					</Link>
				</Button>
				<Form method={"POST"} action="/auth?logout">
					<Button type={"submit"} variant={"outline"} size={"icon"}>
						<LogOut />
					</Button>
				</Form>
			</Header>
			<MainContainer>
				<Outlet />
			</MainContainer>
			<NavBar>
				<Button variant={"outline"} size={"lg"} asChild>
					<NavLink to={`/app/teacher/wallet/${walletId}`}>
						<Home />
					</NavLink>
				</Button>
				<Button variant={"outline"} size={"lg"} asChild>
					<NavLink to={`/app/teacher/wallet/${walletId}/member`}>
						<Users />
					</NavLink>
				</Button>
				<Button variant={"outline"} size={"lg"} asChild>
					<NavLink to={`/app/teacher/wallet/${walletId}/purchase`}>
						<Scroll />
					</NavLink>
				</Button>
			</NavBar>
		</>
	)
}
