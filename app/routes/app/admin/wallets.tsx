import { Link2, Plus, Trash2 } from "lucide-react"
import { Link, useFetcher } from "react-router"
import { toast } from "sonner"
import { MainContainer, Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { createErrorRedirect, createSuccessRedirect, prisma } from "~/services/repository.server"
import { getSession } from "~/services/session.server"
import { verifyAdmin } from "~/services/session.server"
import { formatMoney } from "~/utilities/display"
import type { Route } from "./+types/wallets"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
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
		<MainContainer>
			<Section>
				<SectionTitle>
					<Title>ウォレット作成</Title>
				</SectionTitle>
			</Section>
			<div className="space-y-6">
				<Button asChild>
					<Link to="/app/admin/create-form">
						<Plus />
						<span>新しくウォレットを作成</span>
					</Link>
				</Button>
				<div className="space-y-6">
					{wallets.map((wallet) => (
						<div key={wallet.id} className="border rounded-xl p-4 space-y-4">
							<div className="flex flex-row justify-between">
								<div>
									<Title>{wallet.name}</Title>
									<div>{formatMoney(wallet.budget)}</div>
								</div>

								<div className="flex flex-row gap-2">
									{wallet.parts.length === 0 && (
										<Button variant={"destructive"} onClick={() => fetcher.submit({ id: wallet.id }, { method: "POST" })}>
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
						</div>
					))}
				</div>
			</div>
		</MainContainer>
	)
}

export const action = async ({ request }: Route.ActionArgs) => {
	const formData = await request.formData()
	const id = formData.get("id")
	if (typeof id !== "string") {
		return null
	}
	const session = await getSession(request.headers.get("Cookie"))
	const errorRedirect = createErrorRedirect(session, "/auth")
	verifyAdmin(session)

	await prisma.wallet
		.delete({
			where: { id },
		})
		.catch(errorRedirect)
	const successRedirect = createSuccessRedirect(session, "/app/admin/wallets")
	return successRedirect("ウォレットを削除しました。")
}
