import { KeyRound } from "lucide-react"
import { Form, Link, data, redirect } from "react-router"
import { LimitedContainer, Section, SectionTitle } from "~/components/common/container"
import { Button } from "~/components/ui/button"
import { commitSession, getSession, requireSession } from "~/services/session.server"
import type { Route } from "./+types/auth"

export const loader = async ({ request, params: { action } }: Route.LoaderArgs) => {
	if (action === "logout") {
		const session = await requireSession(request)
		session.unset("user")
		return data(null, { headers: { "Set-Cookie": await commitSession(session) } })
	}
	return null
}

export default ({}: Route.ComponentProps) => {
	return (
		<LimitedContainer>
			<Section>
				<SectionTitle>認証</SectionTitle>
				<Form method={"POST"}>
					<div className="flex flex-col gap-4">
						<Button type={"submit"} name={"user-type"} value={"dev-student"} variant={"outline"}>
							<KeyRound />
							テスト用：生徒として認証
						</Button>
						<Button type={"submit"} name={"user-type"} value={"dev-teacher"} variant={"outline"}>
							<KeyRound />
							テスト用：教師として認証
						</Button>
						<Button name={"user-type"} asChild>
							<Link to={"/app/admin"}>
								<KeyRound />
								管理者として認証
							</Link>
						</Button>
					</div>
				</Form>
			</Section>
		</LimitedContainer>
	)
}

export const action = async ({ request, params: { action } }: Route.ActionArgs) => {
	if (action === "logout") {
		const session = await getSession(request.headers.get("Cookie"))
		session.unset("user")
		return data(null, { headers: { "Set-Cookie": await commitSession(session) } })
	}
	const formData = await request.formData()
	const userType = formData.get("user-type")
	const session = await getSession(request.headers.get("Cookie"))
	if (userType?.toString().startsWith("dev-student")) {
		session.set("user", {
			type: "student",
			id: userType.toString(),
		})
		session.flash("success", { message: "ログインしました。" })
		return redirect("/app/student", { headers: { "Set-Cookie": await commitSession(session) } })
	}
	if (userType?.toString().startsWith("dev-teacher")) {
		session.set("user", {
			type: "teacher",
			id: userType.toString(),
		})
		session.flash("success", { message: "ログインしました。" })
		return redirect("/app/teacher", { headers: { "Set-Cookie": await commitSession(session) } })
	}
	return null
}
