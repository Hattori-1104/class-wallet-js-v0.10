import { Outlet } from "react-router"
import { MainContainer } from "~/components/common/container"
import { Header, HeaderBackButton } from "~/components/common/header"
import { verifyStudent } from "~/services/session.server"
import { requireSession } from "~/services/session.server"
import type { Route } from "../+types/layout"

export const loader = async ({ params: { partId, purchaseId }, request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	return { student, partId, purchaseId }
}

export default ({ loaderData: { partId, purchaseId } }: Route.ComponentProps) => {
	return (
		<>
			<Header>
				<HeaderBackButton to={`/app/student/part/${partId}/purchase/${purchaseId}`} />
			</Header>
			<MainContainer>
				<Outlet />
			</MainContainer>
		</>
	)
}
