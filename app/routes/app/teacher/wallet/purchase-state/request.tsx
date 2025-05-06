import { Request } from "~/components/page/purchase/request"
import { prisma, purchaseStateSelectQuery } from "~/services/repository.server"
import { createErrorRedirect, requireSession } from "~/services/session.server"
import { verifyTeacher } from "~/services/session.server"
import type { Route } from "./+types/request"

export const loader = async ({ request, params: { walletId, purchaseId } }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	await verifyTeacher(session)
	const errorRedirect = createErrorRedirect(session, `/app/teacher/wallet/${walletId}/purchase/${purchaseId}`)
	const purchase = await prisma.purchase
		.findUniqueOrThrow({
			where: { id: purchaseId, part: { wallet: { id: walletId } } },
			include: {
				state: {
					select: purchaseStateSelectQuery(),
				},
			},
		})
		.catch(errorRedirect("購入情報が見つかりません。").catch())
	return { purchase }
}

export default ({ loaderData: { purchase } }: Route.ComponentProps) => {
	return <Request purchase={purchase} isRequester={false} />
}
