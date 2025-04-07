import { ChevronLeft } from "lucide-react"
import { Link, Outlet } from "react-router"
import { Button } from "~/components/ui/button"
import { prisma } from "~/services/repository.server"
import { verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/layout"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const student = await verifyStudent(request)
	const part = await prisma.part.findFirstOrThrow({
		where: { students: { some: { id: student } } },
		select: { id: true },
	})
	return { part }
}

export default ({ loaderData: { part } }: Route.ComponentProps) => (
	<>
		<header className="h-16 border-b shrink-0">
			<div className="container mx-auto px-8 h-full flex flex-row items-center justify-between">
				<Button variant={"outline"} size={"icon"} asChild>
					<Link to={`/app/student/part/${part.id}`}>
						<ChevronLeft />
					</Link>
				</Button>
			</div>
		</header>
		<div className="container mx-auto px-8">
			<Outlet />
		</div>
	</>
)
