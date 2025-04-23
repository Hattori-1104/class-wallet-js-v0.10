import { Link2, Plus, Trash2 } from "lucide-react"
import { Link, useFetcher } from "react-router"
import { toast } from "sonner"
import { Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { prisma } from "~/services/repository.server"
import { createErrorRedirect, createSuccessRedirect } from "~/services/session.server"
import { verifyStudent } from "~/services/session.server"
import { getSession } from "~/services/session.server"
import { formatMoney } from "~/utilities/display"
import type { Route } from "./+types/dashboard"
export const loader = async ({ params: { walletId } }: Route.LoaderArgs) => {
	const wallet = await prisma.wallet.findFirstOrThrow({
		where: { id: walletId },
		select: {
			id: true,
			name: true,
			parts: {
				select: {
					id: true,
					name: true,
					budget: true,
					_count: {
						select: {
							students: true,
						},
					},
				},
			},
		},
	})
	return { wallet }
}

export default ({ loaderData: { wallet } }: Route.ComponentProps) => {
	const fetcher = useFetcher()
	const copyLink = (id: string) => {
		navigator.clipboard.writeText(`${window.location.origin}/app/invite/part/${id}`)
		toast.success("招待リンクをコピーしました。")
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
					<Title>パートの編集</Title>
				</SectionTitle>
				<div className="space-y-6">
					<Button asChild>
						<Link to={`/app/student/wallet/${wallet.id}/create-form`}>
							<Plus />
							<span>新しくパートを作成</span>
						</Link>
					</Button>
					<div className="space-y-6">
						{wallet.parts.map((part) => (
							<div key={part.id} className="border rounded-xl p-4 space-y-4">
								<div className="flex flex-row justify-between">
									<div>
										<Title>{part.name}</Title>
										<div>{formatMoney(part.budget)}</div>
									</div>
									<div className="flex flex-row gap-4">
										{part._count.students === 0 && (
											<Button variant={"destructive"} onClick={() => fetcher.submit({ id: part.id }, { method: "POST" })}>
												<Trash2 />
												<span>パートを削除</span>
											</Button>
										)}
										<Button variant={"outline"} onClick={() => copyLink(part.id)}>
											<Link2 />
											<span>メンバーを招待</span>
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</Section>
		</>
	)
}

export const action = async ({ request, params: { walletId } }: Route.ActionArgs) => {
	const formData = await request.formData()
	const id = formData.get("id")
	if (typeof id !== "string") {
		return null
	}
	const session = await getSession(request.headers.get("Cookie"))
	const errorRedirect = createErrorRedirect(session, "/app/student")
	const studentId = await verifyStudent(session)

	await prisma.part
		.delete({
			where: { id, wallet: { accountantStudents: { some: { id: studentId } } } },
		})
		.catch(errorRedirect("パートの削除に失敗しました。").catch())
	const successRedirect = createSuccessRedirect(session, `/app/student/wallet/${walletId}`)
	return successRedirect("パートを削除しました。")
}
