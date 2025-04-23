import { parseWithZod } from "@conform-to/zod"
import { Form } from "react-router"
import { z } from "zod"
import { LimitedContainer, Section, SectionTitle } from "~/components/common/container"
import { Note, Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { prisma } from "~/services/repository.server"
import { createErrorRedirect, createSuccessRedirect, requireSession, verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/wallet-accountant"

const ActionSchema = z.object({
	action: z.enum(["accept", "reject"]),
})

const queryIsAccountant = (walletId: string, userId: string) =>
	prisma.student.findUnique({ where: { id: userId, wallets: { some: { id: walletId } } }, select: { id: true } })

export const loader = async ({ request, params: { walletId } }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const userId = await verifyStudent(session)
	const errorRedirect = createErrorRedirect(session, "/app")

	const wallet = await prisma.wallet
		.findUniqueOrThrow({ where: { id: walletId }, select: { name: true, teachers: { select: { name: true } } } })
		.catch(errorRedirect("ウォレットが見つかりません。").catch())
	const isAccountant = await queryIsAccountant(walletId, userId)
	return { wallet, isAccountant }
}

export default ({ loaderData: { wallet, isAccountant } }: Route.ComponentProps) => {
	return (
		<LimitedContainer>
			<Section className="text-center">
				<SectionTitle className="space-y-8">
					<Title>ウォレットに招待されています。</Title>
					<div className="space-y-4">
						<Title>{wallet.name}</Title>
						<Note>
							<span>担当教師：</span>
							<span>{wallet.teachers.length > 0 ? wallet.teachers.map((teacher) => teacher.name).join(", ") : "未設定"}</span>
						</Note>
					</div>
				</SectionTitle>
				<Form method="POST" className="flex flex-row gap-4">
					<Button className="grow" type="submit" variant="destructive" name="action" value="reject">
						{isAccountant ? "辞任する" : "拒否する"}
					</Button>
					<Button className="grow" type="submit" variant="positive" name="action" value="accept">
						担当する
					</Button>
				</Form>
			</Section>
		</LimitedContainer>
	)
}

export const action = async ({ request, params: { walletId } }: Route.ActionArgs) => {
	const session = await requireSession(request)
	const userId = await verifyStudent(session)
	const errorRedirect = createErrorRedirect(session, "/app")
	const successRedirect = createSuccessRedirect(session, "/app")

	const result = parseWithZod(await request.formData(), { schema: ActionSchema })
	if (result.status !== "success") return result.reply()
	const { action } = result.value

	if (action === "accept") {
		await prisma.student
			.update({ where: { id: userId }, data: { wallets: { connect: { id: walletId } } } })
			.catch(errorRedirect("ウォレットの参加に失敗しました。").catch())
		return successRedirect("ウォレットの参加に成功しました。")
	}
	if (action === "reject") {
		const isAccountant = await queryIsAccountant(walletId, userId)
		if (isAccountant) {
			await prisma.student
				.update({ where: { id: userId }, data: { wallets: { disconnect: { id: walletId } } } })
				.catch(errorRedirect("ウォレットの辞任に失敗しました。").catch())
			return successRedirect("ウォレットの辞任に成功しました。")
		}
		return successRedirect("招待を拒否しました。")
	}
}
