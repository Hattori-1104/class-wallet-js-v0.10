import { Link } from "react-router"
import { Button } from "~/components/ui/button"
import type { Route } from "./+types/home"

export default ({}: Route.ComponentProps) => {
	return (
		<div className="container">
			<Button variant={"outline"} asChild>
				<Link to="/auth">認証</Link>
			</Button>
			<Button variant={"outline"} asChild>
				<Link to="/app/admin">管理画面</Link>
			</Button>
		</div>
	)
}
