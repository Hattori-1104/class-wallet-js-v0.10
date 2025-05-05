import { Outlet } from "react-router"
import { MainContainer } from "~/components/common/container"
import { Header, HeaderBackButton } from "~/components/common/header"
import { requireSession, verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/layout-push"

export const loader = async ({ params: { partId }, request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	return { student, partId }
}

export default ({ loaderData: { partId } }: Route.ComponentProps) => {
	return (
		<>
			<Header>
				<HeaderBackButton to={`/app/student/part/${partId}`} />
			</Header>
			<MainContainer>
				<Outlet />
			</MainContainer>
		</>
	)
}
