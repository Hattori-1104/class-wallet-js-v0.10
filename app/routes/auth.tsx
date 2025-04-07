import { KeyRound } from "lucide-react"
import { Form, data, redirect } from "react-router"
import { CenterCardContainer, Section, SectionTitle } from "~/components/common/container"
import { Button } from "~/components/ui/button"
import { commitSession, getSession } from "~/services/session.server"
import type { Route } from "./+types/auth"

export default ({}: Route.ComponentProps) => {
	return (
		<CenterCardContainer>
			<Section>
				<SectionTitle>認証</SectionTitle>
				<Form method={"POST"}>
					<Button type={"submit"} name={"user-type"} value={"dev-student"} variant={"outline"}>
						<KeyRound />
						テスト用：生徒として認証
					</Button>
					<Button type={"submit"} name={"user-type"} value={"dev-teacher"} variant={"outline"}>
						<KeyRound />
						テスト用：教師として認証
					</Button>
				</Form>
			</Section>
		</CenterCardContainer>
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
	if (userType === "dev-student") {
		session.set("user", {
			type: "student",
			id: "105926552011320383379",
		})
		session.flash("success", { message: "ログアウトしました。" })
		return redirect("/app/student", { headers: { "Set-Cookie": await commitSession(session) } })
	}
	if (userType === "dev-teacher") {
		session.set("user", {
			type: "teacher",
			id: "105926552011320383379",
		})
		session.flash("success", { message: "ログアウトしました。" })
		return redirect("/app/student", { headers: { "Set-Cookie": await commitSession(session) } })
	}
	return null
}
