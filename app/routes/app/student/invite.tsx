import { parseWithZod } from "@conform-to/zod"
import { Form, Link } from "react-router"
import { z } from "zod"
import {
	LayoutAbsolute,
	LimitedContainer,
	Section,
	SectionContent,
	SectionTitle,
} from "~/components/common/container"
import { Aside } from "~/components/common/placement"
import { Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Label } from "~/components/ui/label"
import { verifyStudent } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import {
	buildErrorRedirect,
	buildSuccessRedirect,
	requireSession,
} from "~/services/session.server"
import type { Route } from "./+types/invite"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	await verifyStudent(session)

	const part = await prisma.part.findUniqueOrThrow({
		where: {
			id: params.partId,
		},
		select: {
			id: true,
			name: true,
			wallet: {
				select: {
					name: true,
				},
			},
		},
	})
	return {
		part,
	}
}

const formSchema = z.object({
	asLeader: z.optional(z.literal("true")),
})

export default ({ loaderData: { part } }: Route.ComponentProps) => {
	return (
		<LayoutAbsolute>
			<LimitedContainer>
				<Section>
					<SectionTitle>
						<Title>
							（{part.wallet.name}）{part.name} に招待されました。
						</Title>
					</SectionTitle>
					<SectionContent>
						<Form method="post" className="space-y-4">
							<Aside>
								<Button variant="outline" asChild className="grow">
									<Link to="/app/student/part">キャンセル</Link>
								</Button>
								<Button type="submit" className="grow">
									参加する
								</Button>
							</Aside>
							<Aside gap="sm">
								<Checkbox id="asLeader" name="asLeader" value="true" />
								<Label htmlFor="asLeader">パートリーダーとして参加する</Label>
							</Aside>
						</Form>
					</SectionContent>
				</Section>
			</LimitedContainer>
		</LayoutAbsolute>
	)
}

export const action = async ({ request, params }: Route.ActionArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: formSchema })
	if (submission.status !== "success") return submission.reply()
	const { value } = submission
	const errorRedirect = buildErrorRedirect("/app/student/part", session)

	if (value.asLeader) {
		const part = await prisma.part
			.update({
				where: { id: params.partId },
				data: {
					leaders: {
						connect: {
							id: student.id,
						},
					},
					students: {
						connect: {
							id: student.id,
						},
					},
				},
				select: {
					name: true,
					id: true,
				},
			})
			.catch(() => errorRedirect("パートの参加に失敗しました。"))
		const successRedirect = buildSuccessRedirect(
			`/app/student/part/${part.id}`,
			session,
		)
		return successRedirect(`パートリーダーとして${part.name}に参加しました`)
	}

	const part = await prisma.part
		.update({
			where: {
				id: params.partId,
			},
			data: {
				students: {
					connect: {
						id: student.id,
					},
				},
				leaders: {
					disconnect: {
						id: student.id,
					},
				},
			},
			select: {
				id: true,
				name: true,
			},
		})
		.catch(() => errorRedirect("パートの参加に失敗しました。"))
	const successRedirect = buildSuccessRedirect(
		`/app/student/part/${part.id}`,
		session,
	)
	return successRedirect("パートに参加しました。")
}
