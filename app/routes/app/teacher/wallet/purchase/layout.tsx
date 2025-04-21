import { ChevronLeft } from "lucide-react"
import { Outlet, useNavigate } from "react-router"
import { MainContainer } from "~/components/common/container"
import { Header } from "~/components/common/header"
import { Button } from "~/components/ui/button"

export default () => {
	const navigate = useNavigate()
	return (
		<>
			<Header>
				<Button variant="ghost" className="size-12" onClick={() => navigate(-1)}>
					<ChevronLeft />
				</Button>
			</Header>
			<MainContainer>
				<Outlet />
			</MainContainer>
		</>
	)
}
