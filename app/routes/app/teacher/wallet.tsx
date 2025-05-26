import { Section } from "~/components/common/container"
import { NoData } from "~/components/common/typography"
import { prisma } from "~/services/repository.server"
import { entryTeacherRoute } from "~/services/route-module.server"
import type { Route } from "./+types/wallet"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { teacher, walletId } = await entryTeacherRoute(
		request,
		params.walletId,
		false,
	)

	if (!walletId) return null

	const belongWallets = await prisma.wallet.findMany({
		where: { teachers: { some: { id: teacher.id } } },
	})

	return { teacher, walletId, belongWallets }
}

export default ({ loaderData }: Route.ComponentProps) => {
	if (!loaderData)
		return (
			<>
				<Section>
					<NoData>ウォレットに所属していません。</NoData>
				</Section>
			</>
		)
	const { teacher, walletId } = loaderData
	return (
		<div>
			{teacher.name} {walletId}
		</div>
	)
}
