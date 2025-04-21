import { ChevronLeft, Home, LogOut, Scroll, Users } from "lucide-react"
import { Form, Link, NavLink, Outlet } from "react-router"
import { MainContainer } from "~/components/common/container"
import { Header } from "~/components/common/header"
import { NavBar, navBarItemClassName } from "~/components/common/navbar"
import { Button } from "~/components/ui/button"
import type { Route } from "./+types/layout"

export default ({ params: { partId } }: Route.ComponentProps) => {
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
			<NavBar>
				<NavLink to={`/app/student/part/${partId}`} className={navBarItemClassName.item}>
					<Home size={20} />
					<span className={navBarItemClassName.label}>ダッシュボード</span>
				</NavLink>

				<NavLink to={`/app/student/part/${partId}/member`} className={navBarItemClassName.item}>
					<Users size={20} />
					<span className={navBarItemClassName.label}>メンバー</span>
				</NavLink>

				<NavLink to={`/app/student/part/${partId}/purchase`} className={navBarItemClassName.item}>
					<Scroll size={20} />
					<span className={navBarItemClassName.label}>購入履歴</span>
				</NavLink>
			</NavBar>
		</>
	)
}
