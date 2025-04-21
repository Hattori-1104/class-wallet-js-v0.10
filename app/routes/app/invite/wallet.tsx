import { Form } from "react-router"
import { MainContainer, Section, SectionTitle } from "~/components/common/container"
import { Note, Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { prisma } from "~/services/repository.server"
import { createErrorRedirect, createSuccessRedirect } from "~/services/repository.server"
import { getSession, verifyUser } from "~/services/session.server"
import type { Route } from "./+types/wallet"

export const loader = async ({ request, params: { walletId } }: Route.LoaderArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const errorRedirect = createErrorRedirect(session, "/auth")
	const wallet = await prisma.wallet
		.findUniqueOrThrow({
			where: {
				id: walletId,
			},
			select: {
				id: true,
				name: true,
				teachers: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		})
		.catch(errorRedirect("ウォレットが見つかりません。").catch())
	return { wallet }
}

export default ({ loaderData: { wallet } }: Route.ComponentProps) => {
	return (
		<MainContainer className="flex flex-col items-center justify-center">
			<Section className="text-center">
				<SectionTitle>
					<Title>ウォレットに招待されています。</Title>
				</SectionTitle>
				<div className="border rounded-2xl p-8 space-y-4">
					<Title>{wallet.name}</Title>
					<Note>
						<span>担当教師：</span>
						<span>{wallet.teachers.map((teacher) => teacher.name).join(", ")}</span>
					</Note>
					<Form method="POST" className="flex flex-row gap-4 mt-8">
						<Button type="submit" variant="destructive" className="grow" name="action" value="reject">
							拒否する
						</Button>
						<Button type="submit" variant="default" className="grow" name="action" value="accept">
							参加する
						</Button>
					</Form>
				</div>
			</Section>
		</MainContainer>
	)
}

export const action = async ({ request, params: { walletId } }: Route.ActionArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const errorRedirect = createErrorRedirect(session, "/auth")
	const successRedirect = createSuccessRedirect(session, "/app")
	const formData = await request.formData()
	const action = formData.get("action")
	if (action !== "accept") {
		return successRedirect("招待を拒否しました。")
	}
	const user = await verifyUser(session)
	if (user.type === "student") {
		await prisma.wallet
			.update({ where: { id: walletId }, data: { accountantStudents: { connect: { id: user.id } } } })
			.catch(errorRedirect("ウォレットの参加に失敗しました。").catch())
		return successRedirect("招待を受け入れました。")
	}
	if (user.type === "teacher") {
		await prisma.wallet
			.update({ where: { id: walletId }, data: { teachers: { connect: { id: user.id } } } })
			.catch(errorRedirect("ウォレットの参加に失敗しました。").catch())
		return successRedirect("招待を受け入れました。")
	}
}
