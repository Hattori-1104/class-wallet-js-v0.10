import { Outlet } from "react-router"
import { MainContainer } from "~/components/common/container"
import { Header, HeaderBackButton } from "~/components/common/header"

export default () => {
	return (
		<>
			<Header>
				<HeaderBackButton />
			</Header>
			<MainContainer>
				<Outlet />
			</MainContainer>
		</>
	)
}
