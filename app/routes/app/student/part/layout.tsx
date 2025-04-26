import { Home, Scroll, Users } from "lucide-react"
import { NavLink, Outlet } from "react-router"
import { MainContainer } from "~/components/common/container"
import { Header, HeaderBackButton, HeaderLogOutButton, HeaderUserInfo } from "~/components/common/header"
import { NavBar, navBarItemClassName } from "~/components/common/navbar"
import { Aside } from "~/components/common/placement"
import { verifyStudent } from "~/services/session.server"
import { requireSession } from "~/services/session.server"
import type { Route } from "./+types/layout"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)

	return { student }
}

export default ({ params: { partId }, loaderData: { student } }: Route.ComponentProps) => {
	return (
		<>
			<Header>
				<HeaderBackButton to="/app/student" />
				<Aside>
					<HeaderUserInfo {...student} />
					<HeaderLogOutButton />
				</Aside>
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
