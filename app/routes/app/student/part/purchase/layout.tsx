import { ChevronLeft } from "lucide-react"
import { Outlet, useNavigate } from "react-router"
import { MainContainer } from "~/components/common/container"
import { Header } from "~/components/common/header"
import { Button } from "~/components/ui/button"
import { createErrorRedirect, prisma } from "~/services/repository.server"
import { getSession, verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/layout"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const student = await verifyStudent(session)
	const errorRedirect = createErrorRedirect(session, "/app/student")
	const part = await prisma.part
		.findFirstOrThrow({
			where: { students: { some: { id: student } } },
			select: { id: true },
		})
		.catch(errorRedirect("パートを取得できませんでした。").catch())
	return { part }
}

export default ({ loaderData: { part } }: Route.ComponentProps) => {
	const navigate = useNavigate()
	return (
		<>
			<Header>
				<Button variant={"ghost"} className="size-12" onClick={() => navigate(-1)}>
					<ChevronLeft />
				</Button>
			</Header>
			<MainContainer>
				<Outlet />
			</MainContainer>
		</>
	)
}
