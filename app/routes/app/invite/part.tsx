import { Form, Link } from "react-router"
import { MainContainer } from "~/components/common/container"
import { SectionTitle } from "~/components/common/container"
import { Section } from "~/components/common/container"
import { Note, Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { createErrorRedirect, createSuccessRedirect, prisma } from "~/services/repository.server"
import { getSession, verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/part"

export const loader = async ({ request, params: { partId } }: Route.LoaderArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const errorRedirect = createErrorRedirect(session, "/auth")
	const part = await prisma.part
		.findUniqueOrThrow({
			where: { id: partId },
			select: {
				id: true,
				name: true,
				wallet: {
					select: {
						name: true,
						teachers: {
							select: {
								name: true,
							},
						},
					},
				},
			},
		})
		.catch(errorRedirect("パートが見つかりません。").catch())
	return { part }
}

export default ({ loaderData: { part } }: Route.ComponentProps) => {
	return (
		<MainContainer className="flex flex-col items-center justify-center">
			<Section className="text-center">
				<SectionTitle>
					<Title>パートに招待されています。</Title>
				</SectionTitle>
				<div className="border rounded-2xl p-8 space-y-4">
					<Title>{`${part.wallet.name} - ${part.name}`}</Title>
					<Note>
						<span>担当教師：</span>
						<span>{part.wallet.teachers.map((teacher) => teacher.name).join(", ")}</span>
					</Note>
					<Form method="POST" className="flex flex-col gap-4">
						<div className="flex flex-row gap-4">
							<Button type="submit" variant="destructive" className="grow" name="action" value="reject">
								拒否する
							</Button>
							<Button type="submit" variant="default" className="grow" name="action" value="accept">
								参加する
							</Button>
						</div>
						<Button variant="default" name="action" value="accept-as-leader">
							パートリーダーとして参加
						</Button>
					</Form>
				</div>
			</Section>
		</MainContainer>
	)
}

export const action = async ({ request, params: { partId } }: Route.ActionArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const errorRedirect = createErrorRedirect(session, "/auth")
	const successRedirect = createSuccessRedirect(session, "/app")
	const formData = await request.formData()
	const action = formData.get("action")
	if (action !== "accept-as-leader" && action !== "accept") {
		return successRedirect("招待を拒否しました。")
	}
	const studentId = await verifyStudent(session)
	await prisma.part
		.update({
			where: { id: partId },
			data: Object.assign({ students: { connect: { id: studentId } } }, action === "accept-as-leader" ? { leaders: { connect: { id: studentId } } } : {}),
		})
		.catch(errorRedirect("パートの参加に失敗しました。").catch())
	return successRedirect("パートに参加しました。")
}
