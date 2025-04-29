import { parseWithZod } from "@conform-to/zod"
import { Form } from "react-router"
import { z } from "zod"
import { LimitedContainer, Section, SectionTitle } from "~/components/common/container"
import { Note, Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { prisma, queryIsAccountant } from "~/services/repository.server"
import { createErrorRedirect, createSuccessRedirect, requireSession, verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/wallet-accountant"

const ActionSchema = z.object({
	action: z.enum(["accept", "reject"]),
})

export const loader = async ({ request, params: { walletId } }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	const errorRedirect = createErrorRedirect(session, "/app")

	const wallet = await prisma.wallet
		.findUniqueOrThrow({ where: { id: walletId }, select: { name: true, teachers: { select: { name: true } } } })
		.catch(errorRedirect("ウォレットが見つかりません。").catch())
	const isAccountant = await queryIsAccountant(walletId, student.id)
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
							<span>
								{wallet.teachers.length > 0 ? wallet.teachers.map((teacher) => teacher.name).join(", ") : "未設定"}
							</span>
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
	const student = await verifyStudent(session)
	const errorRedirect = createErrorRedirect(session, "/app")
	const successRedirect = createSuccessRedirect(session, "/app")

	const result = parseWithZod(await request.formData(), { schema: ActionSchema })
	if (result.status !== "success") return result.reply()
	const { action } = result.value

	if (action === "accept") {
		const wallet = await prisma.wallet
			.update({
				where: { id: walletId },
				data: { accountantStudents: { connect: { id: student.id } } },
				select: { name: true },
			})
			.catch(errorRedirect("ウォレットの参加に失敗しました。").catch())
		return successRedirect(`${wallet.name}のHR会計として参加しました。`)
	}
	if (action === "reject") {
		const isAccountant = await queryIsAccountant(walletId, student.id)
		if (isAccountant) {
			const wallet = await prisma.wallet
				.update({
					where: { id: walletId },
					data: { accountantStudents: { disconnect: { id: student.id } } },
					select: { name: true },
				})
				.catch(errorRedirect("ウォレットの辞任に失敗しました。").catch())
			return successRedirect(`${wallet.name}のHR会計を辞任しました。`)
		}
		return successRedirect("招待を拒否しました。")
	}
}
