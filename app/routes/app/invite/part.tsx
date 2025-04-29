import { parseWithZod } from "@conform-to/zod"
import { Form } from "react-router"
import { z } from "zod"
import { SectionTitle } from "~/components/common/container"
import { Section } from "~/components/common/container"
import { LimitedContainer } from "~/components/common/container"
import { Note, Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible"
import { prisma, queryIsBelonging, queryIsLeader } from "~/services/repository.server"
import { createErrorRedirect, createSuccessRedirect, requireSession, verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/part"

const ActionSchema = z.object({
	action: z.enum(["accept", "reject", "leave", "leader-accept", "leader-leave"]),
})

export const loader = async ({ request, params: { partId } }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	const errorRedirect = createErrorRedirect(session, "/app/student")
	const part = await prisma.part
		.findUniqueOrThrow({
			where: { id: partId },
			select: {
				name: true,
				wallet: {
					select: { name: true, teachers: { select: { name: true } }, accountantStudents: { select: { name: true } } },
				},
			},
		})
		.catch(errorRedirect("パートが見つかりません。").catch())
	const isBelonging = await queryIsBelonging(partId, student.id)
	const isLeader = await queryIsLeader(partId, student.id)
	return { part, isBelonging, isLeader }
}

export default ({ loaderData: { part, isBelonging, isLeader } }: Route.ComponentProps) => {
	return (
		<LimitedContainer>
			<Section className="text-center">
				<SectionTitle className="space-y-8">
					<Title>パートに招待されています。</Title>
					<div className="space-y-4">
						<Title>
							{part.wallet.name} - {part.name}
						</Title>
						<Note>
							<span>担当教師：</span>
							<span>
								{part.wallet.teachers.length > 0
									? part.wallet.teachers.map((teacher) => teacher.name).join(", ")
									: "未設定"}
							</span>
						</Note>
						<Note>
							<span>会計：</span>
							<span>
								{part.wallet.accountantStudents.length > 0
									? part.wallet.accountantStudents.map((accountant) => accountant.name).join(", ")
									: "未設定"}
							</span>
						</Note>
					</div>
				</SectionTitle>
				<Form method="POST" className="space-y-4">
					<div className="flex flex-row gap-4">
						{isBelonging ? (
							<Button className="grow" type="submit" variant="destructive" name="action" value="leave">
								脱退する
							</Button>
						) : (
							<Button className="grow" type="submit" variant="destructive" name="action" value="reject">
								拒否する
							</Button>
						)}
						<Button className="grow" type="submit" variant="positive" name="action" value="accept">
							参加する
						</Button>
					</div>
					<Collapsible className="space-y-4">
						<CollapsibleTrigger asChild>
							<Button className="w-full" variant="outline">
								パートリーダーの方はこちら
							</Button>
						</CollapsibleTrigger>
						<CollapsibleContent>
							{isLeader ? (
								<Button className="w-full" type="submit" variant="destructive" name="action" value="leader-leave">
									パートリーダーを辞任する
								</Button>
							) : (
								<Button className="w-full" type="submit" variant="positive" name="action" value="leader-accept">
									パートリーダーを担当する
								</Button>
							)}
						</CollapsibleContent>
					</Collapsible>
				</Form>
			</Section>
		</LimitedContainer>
	)
}

export const action = async ({ request, params: { partId } }: Route.ActionArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	const errorRedirect = createErrorRedirect(session, "/app/student")
	const successRedirect = createSuccessRedirect(session, "/app/student")

	const result = parseWithZod(await request.formData(), { schema: ActionSchema })
	if (result.status !== "success") return result.reply()
	const { action } = result.value

	if (action === "accept") {
		const part = await prisma.part
			.update({
				where: { id: partId },
				data: { students: { connect: { id: student.id } } },
				select: { id: true, name: true },
			})
			.catch(errorRedirect("パートの参加に失敗しました。").catch())
		return successRedirect(`${part.name}に参加しました。`, `/app/student/part/${part.id}`)
	}
	if (action === "reject") {
		return successRedirect("招待を拒否しました。")
	}
	if (action === "leave") {
		const part = await prisma.part
			.update({
				where: { id: partId },
				data: { students: { disconnect: { id: student.id } }, leaders: { disconnect: { id: student.id } } },
				select: { name: true },
			})
			.catch(errorRedirect("パートの脱退に失敗しました。").catch())
		return successRedirect(`${part.name}から脱退しました。`)
	}
	if (action === "leader-accept") {
		const part = await prisma.part
			.update({
				where: { id: partId },
				data: { leaders: { connect: { id: student.id } }, students: { connect: { id: student.id } } },
				select: { id: true, name: true },
			})
			.catch(errorRedirect("パートリーダーの担当に失敗しました。").catch())
		return successRedirect(`${part.name}のパートリーダーになりました。`, `/app/student/part/${part.id}`)
	}
	if (action === "leader-leave") {
		const part = await prisma.part
			.update({ where: { id: partId }, data: { leaders: { disconnect: { id: student.id } } }, select: { name: true } })
			.catch(errorRedirect("パートリーダーの辞任に失敗しました。").catch())
		return successRedirect(`${part.name}のパートリーダーを辞任しました。`)
	}
}
