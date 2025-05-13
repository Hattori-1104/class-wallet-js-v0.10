import { parseWithZod } from "@conform-to/zod"
import { Form } from "react-router"
import { z } from "zod"
import {
	LimitedContainer,
	Section,
	SectionTitle,
} from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { prisma, queryIsHomeroomTeacher } from "~/services/repository.server"
import {
	_createErrorRedirect,
	_createSuccessRedirect,
	requireSession,
	verifyTeacher,
} from "~/services/session.server"
import type { Route } from "./+types/wallet-teacher"

const ActionSchema = z.object({
	action: z.enum(["accept", "reject"]),
})

export const loader = async ({
	request,
	params: { walletId },
}: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const teacher = await verifyTeacher(session)
	const errorRedirect = _createErrorRedirect(session, "/app")

	const wallet = await prisma.wallet
		.findUniqueOrThrow({ where: { id: walletId }, select: { name: true } })
		.catch(errorRedirect("ウォレットが見つかりません。").catch())
	const isHomeroomTeacher = await queryIsHomeroomTeacher(walletId, teacher.id)
	return { wallet, isHomeroomTeacher }
}

export default ({
	loaderData: { wallet, isHomeroomTeacher },
}: Route.ComponentProps) => {
	return (
		<LimitedContainer>
			<Section className="text-center">
				<SectionTitle className="space-y-8">
					<Title>ウォレットに招待されています。</Title>
					<Title>{wallet.name}</Title>
				</SectionTitle>
				<Form method="POST" className="flex flex-row gap-4">
					<Button
						className="grow"
						type="submit"
						variant="destructive"
						name="action"
						value="reject"
					>
						{isHomeroomTeacher ? "辞任する" : "拒否する"}
					</Button>
					<Button
						className="grow"
						type="submit"
						variant="positive"
						name="action"
						value="accept"
					>
						担当する
					</Button>
				</Form>
			</Section>
		</LimitedContainer>
	)
}

export const action = async ({
	request,
	params: { walletId },
}: Route.ActionArgs) => {
	const session = await requireSession(request)
	const teacher = await verifyTeacher(session)
	const errorRedirect = _createErrorRedirect(session, "/app")
	const successRedirect = _createSuccessRedirect(session, "/app")

	const result = parseWithZod(await request.formData(), {
		schema: ActionSchema,
	})
	if (result.status !== "success") return result.reply()
	const { action } = result.value

	if (action === "accept") {
		const wallet = await prisma.wallet
			.update({
				where: { id: walletId },
				data: { teachers: { connect: { id: teacher.id } } },
				select: { name: true },
			})
			.catch(errorRedirect("ウォレットの参加に失敗しました。").catch())
		return successRedirect(`${wallet.name}の担任教師として参加しました。`)
	}
	if (action === "reject") {
		const isHomeroomTeacher = await queryIsHomeroomTeacher(walletId, teacher.id)
		if (isHomeroomTeacher) {
			const wallet = await prisma.wallet
				.update({
					where: { id: walletId },
					data: { teachers: { disconnect: { id: teacher.id } } },
					select: { name: true },
				})
				.catch(errorRedirect("ウォレットの辞任に失敗しました。").catch())
			return successRedirect(`${wallet.name}の担任教師を辞任しました。`)
		}
		return successRedirect("招待を拒否しました。")
	}
}
