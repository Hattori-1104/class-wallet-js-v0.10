import { Link2, Plus, Trash2 } from "lucide-react"
import { Link, useFetcher } from "react-router"
import { toast } from "sonner"
import { LightBox } from "~/components/common/box"
import { Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { prisma } from "~/services/repository.server"
import { createErrorRedirect, createSuccessRedirect, requireSession } from "~/services/session.server"
import { verifyAdmin } from "~/services/session.server"
import { formatMoney } from "~/utilities/display"
import type { Route } from "./+types/wallet"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	verifyAdmin(session)

	const wallets = await prisma.wallet.findMany({
		select: {
			id: true,
			name: true,
			budget: true,
			parts: {
				select: {
					id: true,
					name: true,
					budget: true,
				},
			},
		},
	})

	return { wallets }
}

export default ({ loaderData }: Route.ComponentProps) => {
	const fetcher = useFetcher()

	const copyLink = (id: string) => {
		navigator.clipboard.writeText(`${window.location.origin}/app/invite/wallet/${id}`)
		toast.success("招待リンクをコピーしました。")
	}
	const { wallets } = loaderData
	return (
		<>
			<Section>
				<SectionTitle>
					<Title>ウォレット</Title>
				</SectionTitle>
			</Section>
			<div className="space-y-6">
				<Button asChild>
					<Link to="/app/admin/wallet/create">
						<Plus />
						<span>新しくウォレットを作成</span>
					</Link>
				</Button>
				<div className="space-y-6">
					{wallets.map((wallet) => (
						<LightBox key={wallet.id} className="p-4 space-y-4">
							<div className="flex flex-row justify-between">
								<div>
									<Title>{wallet.name}</Title>
									<div>{formatMoney(wallet.budget)}</div>
								</div>

								<div className="flex flex-row gap-2">
									{wallet.parts.length === 0 && (
										<Button
											variant={"destructive"}
											onClick={() => fetcher.submit({ id: wallet.id }, { method: "POST" })}
										>
											<Trash2 />
											<span>ウォレットを削除</span>
										</Button>
									)}
									<Button variant={"outline"} onClick={() => copyLink(wallet.id)}>
										<Link2 />
										<span>教師・HR会計を招待</span>
									</Button>
								</div>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
								{wallet.parts.map((part) => (
									<div className="p-4 border rounded" key={part.id}>
										<Title>{part.name}</Title>
										<div>{formatMoney(part.budget)}</div>
									</div>
								))}
							</div>
						</LightBox>
					))}
				</div>
			</div>
		</>
	)
}

export const action = async ({ request }: Route.ActionArgs) => {
	const formData = await request.formData()
	const id = formData.get("id")
	if (typeof id !== "string") {
		return null
	}
	const session = await requireSession(request)
	const errorRedirect = createErrorRedirect(session, "/auth")
	verifyAdmin(session)

	await prisma.wallet
		.delete({
			where: { id },
		})
		.catch(errorRedirect)
	const successRedirect = createSuccessRedirect(session, "/app/admin/wallet")
	return successRedirect("ウォレットを削除しました。")
}
