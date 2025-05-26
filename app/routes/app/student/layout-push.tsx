import { Outlet } from "react-router"
import { LayoutAbsolute, MainContainer } from "~/components/common/container"
import { Header, HeaderBackButton } from "~/components/common/header"
import { entryStudentRoute } from "~/services/route-module.server"
import type { Route } from "./+types/layout-main"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { partId } = await entryStudentRoute(request, params.partId)

	return { partId }
}

export default ({ loaderData: { partId } }: Route.ComponentProps) => {
	return (
		<>
			<LayoutAbsolute>
				<Header>
					<HeaderBackButton to={`/app/student/part/${partId}`} />
				</Header>
				<MainContainer>
					<Outlet />
				</MainContainer>
			</LayoutAbsolute>
		</>
	)
}
