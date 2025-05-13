import { Section } from "~/components/common/container"
import { NoData } from "~/components/common/typography"
import { prisma } from "~/services/repository.server"
import { entryPartRoute } from "~/services/route-module.server"
import type { Route } from "./+types/wallet"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	// セッション情報の取得 & 検証
	const { student, partId } = await entryPartRoute(request, params.partId)

	// パートに所属していない場合
	if (!partId) return null

	// データを取得
	// FIXME: エラーハンドリングが未実装
	const wallet = await prisma.wallet.findFirstOrThrow({
		where: {
			parts: { some: { id: partId, students: { some: { id: student.id } } } },
		},
	})

	return { wallet }
}

export default ({ loaderData }: Route.ComponentProps) => {
	if (!loaderData)
		return (
			<Section>
				<NoData>ウォレットに所属していません。</NoData>
			</Section>
		)
	return <div>wallet {loaderData.wallet.name}</div>
}
