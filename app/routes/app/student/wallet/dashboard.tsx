import { parseWithZod } from "@conform-to/zod"
import { Ellipsis, Link2, Plus, Trash2 } from "lucide-react"
import { Link, useFetcher } from "react-router"
import { toast } from "sonner"
import { z } from "zod"
import { LightBox } from "~/components/common/box"
import { SectionTitle } from "~/components/common/container"
import { Section } from "~/components/common/container"
import { Aside, Distant } from "~/components/common/placement"
import { Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu"
import { prisma, walletWithAccountantWhereQuery } from "~/services/repository.server"
import { createErrorRedirect, createSuccessRedirect, requireSession, verifyStudent } from "~/services/session.server"
import { formatMoney } from "~/utilities/display"
import type { Route } from "./+types/dashboard"

const ActionSchema = z.object({
	partId: z.string(),
	action: z.enum(["delete-part"]),
})

export const loader = async ({ request, params: { walletId } }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	const errorRedirect = createErrorRedirect(session, "/app/student")
	const wallet = await prisma.wallet
		.findUniqueOrThrow({
			where: { ...walletWithAccountantWhereQuery(walletId, student.id) },
			select: {
				id: true,
				name: true,
				parts: { select: { id: true, name: true, budget: true, _count: { select: { students: true } } } },
			},
		})
		.catch(errorRedirect("ウォレットが見つかりません。").catch())
	return { wallet }
}

export default ({ loaderData: { wallet } }: Route.ComponentProps) => {
	const fetcher = useFetcher()
	const copyInviteLink = async (id: string) => {
		try {
			await navigator.clipboard.writeText(`${window.location.origin}/app/invite/part/${id}`)
			toast.success("招待リンクをコピーしました。")
		} catch (error: unknown) {
			console.error`${error}`
			toast.error("招待リンクのコピーに失敗しました。")
		}
	}
	const handleDeletePart = (partId: string) => {
		fetcher.submit({ partId, action: "delete-part" }, { method: "POST" })
	}
	return (
		<>
			<Section>
				<SectionTitle>
					<Title>{wallet.name}</Title>
				</SectionTitle>
			</Section>
			<Section>
				<SectionTitle>
					<Distant className="flex-wrap">
						<Title>パートの編集</Title>
						<Aside className="flex-wrap">
							<Button variant="outline" asChild>
								<Link to="create-bazaar">
									<Plus />
									<span>バザー専用パートを作成</span>
								</Link>
							</Button>
							<Button variant="outline" asChild>
								<Link to="create">
									<Plus />
									<span>パートを作成</span>
								</Link>
							</Button>
						</Aside>
					</Distant>
				</SectionTitle>
				<div className="space-y-6">
					{wallet.parts.map((part) => (
						<LightBox key={part.id}>
							<Distant>
								<div>
									<Title>{part.name}</Title>
									<div>{formatMoney(part.budget)}</div>
								</div>
								<Aside>
									<Button variant="outline" onClick={() => copyInviteLink(part.id)}>
										<Link2 />
										<span>メンバーを招待</span>
									</Button>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="outline" size="icon">
												<Ellipsis />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											<DropdownMenuItem
												variant="destructive"
												disabled={part._count.students > 0}
												onClick={() => handleDeletePart(part.id)}
											>
												<Trash2 />
												<span>パートを削除</span>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</Aside>
							</Distant>
						</LightBox>
					))}
				</div>
			</Section>
		</>
	)
}

export const action = async ({ request, params: { walletId } }: Route.ActionArgs) => {
	const session = await requireSession(request)
	await verifyStudent(session)
	const errorRedirect = createErrorRedirect(session, `/app/student/wallet/${walletId}`)
	const successRedirect = createSuccessRedirect(session, `/app/student/wallet/${walletId}`)
	const result = parseWithZod(await request.formData(), { schema: ActionSchema })
	if (result.status !== "success") return result.reply()
	const { partId, action } = result.value
	if (action === "delete-part") {
		await prisma.part
			.delete({ where: { id: partId, students: { none: {} } } })
			.catch(errorRedirect("パートの削除に失敗しました。").catch())
		return successRedirect("パートを削除しました。")
	}
}
