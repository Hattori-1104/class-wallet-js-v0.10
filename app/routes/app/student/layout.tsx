import { Outlet } from "react-router"
import { MainContainer } from "~/components/common/container"
import { Header, HeaderBackButton, HeaderLogOutButton, HeaderUserInfo } from "~/components/common/header"
import { Aside } from "~/components/common/placement"
import { requireSession } from "~/services/session.server"
import { verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/layout"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)

	return { student }
}

export default ({ loaderData: { student } }: Route.ComponentProps) => {
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
		</>
	)
}
