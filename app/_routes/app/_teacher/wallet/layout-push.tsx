import { Outlet } from "react-router"
import { MainContainer } from "~/components/common/container"
import { Header, HeaderBackButton } from "~/components/common/header"
import { requireSession, verifyTeacher } from "~/services/session.server"
import type { Route } from "./+types/layout-push"

export const loader = async ({ params: { walletId }, request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const teacher = await verifyTeacher(session)
	return { teacher, walletId }
}

export default ({ loaderData: { walletId } }: Route.ComponentProps) => {
	return (
		<>
			<Header>
				<HeaderBackButton to={`/app/teacher/wallet/${walletId}`} />
			</Header>
			<MainContainer>
				<Outlet />
			</MainContainer>
		</>
	)
}
