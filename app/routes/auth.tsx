import { KeyRound } from "lucide-react"
import { Form, Link, data, redirect } from "react-router"
import { LimitedContainer, Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import { requireSession } from "~/services/session.server"
import { commitSession } from "~/services/session.server"
import type { Route } from "./+types/auth"

export const loader = async ({ request, params: { action } }: Route.LoaderArgs) => {
	if (action === "logout") {
		const session = await requireSession(request)
		session.unset("user")
		return redirect("/auth", { headers: { "Set-Cookie": await commitSession(session) } })
	}
	return null
}

export default ({}: Route.ComponentProps) => {
	return (
		<LimitedContainer>
			<Section>
				<SectionTitle>
					<Title>認証</Title>
				</SectionTitle>
				<div className="space-y-6">
					<Button variant={"outline"} className="w-full" asChild>
						<Link to="/app">ダッシュボードへ</Link>
					</Button>
					<Form action="/auth/oauth" className="space-y-4">
						<Button type="submit" name="user-type" value="student" variant="google" className="w-full">
							<KeyRound className="size-4 mr-1" />
							生徒として認証
						</Button>
						<Button type="submit" name="user-type" value="teacher" variant="google" className="w-full">
							<KeyRound className="size-4 mr-1" />
							教師として認証
						</Button>
					</Form>
					<Separator />
					<Form method={"POST"} className="space-y-4">
						<Button type={"submit"} name={"user-type"} value={"dev-student"} variant={"outline"} className="w-full">
							<KeyRound />
							テスト用：生徒として認証
						</Button>
						<Button type={"submit"} name={"user-type"} value={"dev-teacher"} variant={"outline"} className="w-full">
							<KeyRound />
							テスト用：教師として認証
						</Button>
						<Button name={"user-type"} asChild className="w-full">
							<Link to={"/app/admin"}>
								<KeyRound />
								テスト用：管理者として認証
							</Link>
						</Button>
					</Form>
				</div>
			</Section>
		</LimitedContainer>
	)
}

export const action = async ({ request, params: { action } }: Route.ActionArgs) => {
	const session = await requireSession(request)
	if (action === "logout") {
		session.unset("user")
		return data(null, { headers: { "Set-Cookie": await commitSession(session) } })
	}
	const formData = await request.formData()
	const userType = formData.get("user-type")
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
