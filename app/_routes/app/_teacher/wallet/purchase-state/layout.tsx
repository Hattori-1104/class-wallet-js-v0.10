import { Outlet } from "react-router"
import { MainContainer } from "~/components/common/container"
import { Header, HeaderBackButton } from "~/components/common/header"
import { verifyTeacher } from "~/services/session.server"
import { requireSession } from "~/services/session.server"
import type { Route } from "./+types/layout"

export const loader = async ({ params: { walletId, purchaseId }, request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const teacher = await verifyTeacher(session)
	return { teacher, walletId, purchaseId }
}

export default ({ loaderData: { walletId, purchaseId } }: Route.ComponentProps) => {
	return (
		<>
			<Header>
				<HeaderBackButton to={`/app/teacher/wallet/${walletId}/purchase/${purchaseId}`} />
			</Header>
			<MainContainer>
				<Outlet />
			</MainContainer>
		</>
	)
}
