import { Outlet } from "react-router"
import { LayoutRelative, MainContainer } from "~/components/common/container"
import { HeaderBackButton, HeaderUserInfo } from "~/components/common/header"
import { Header } from "~/components/common/header"
import { entryAdminRoute } from "~/route-modules/common.server"
import type { Route } from "./+types/layout"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const { admin } = await entryAdminRoute(request)
	return { admin }
}

export default ({ loaderData: { admin } }: Route.ComponentProps) => {
	return (
		<LayoutRelative>
			<Header>
				<HeaderBackButton to="/app/student" />
				<HeaderUserInfo {...admin} />
			</Header>

			<MainContainer>
				<Outlet />
			</MainContainer>
		</LayoutRelative>
	)
}
