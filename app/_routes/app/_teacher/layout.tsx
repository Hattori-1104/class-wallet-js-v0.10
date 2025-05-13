import { Outlet } from "react-router"
import { MainContainer } from "~/components/common/container"
import { Header, HeaderBackButton, HeaderLogOutButton, HeaderUserInfo } from "~/components/common/header"
import { Aside } from "~/components/common/placement"
import { requireSession, verifyTeacher } from "~/services/session.server"
import type { Route } from "./+types/layout"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const teacher = await verifyTeacher(session)

	return { teacher }
}

export default ({ loaderData: { teacher } }: Route.ComponentProps) => {
	return (
		<>
			<Header>
				<HeaderBackButton to="/app/teacher" />
				<Aside>
					<HeaderUserInfo {...teacher} />
					<HeaderLogOutButton />
				</Aside>
			</Header>
			<MainContainer>
				<Outlet />
			</MainContainer>
		</>
	)
}
