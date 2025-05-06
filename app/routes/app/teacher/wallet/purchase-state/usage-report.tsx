import { verifyTeacher } from "~/services/session.server"

import { requireSession } from "~/services/session.server"

import { prisma } from "~/services/repository.server"

import { purchaseStateSelectQuery } from "~/services/repository.server"
import { createErrorRedirect } from "~/services/session.server"

import { UsageReport } from "~/components/page/purchase/usage-report"
import type { Route } from "./+types/usage-report"

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
	return <UsageReport purchase={purchase} isRequester={false} />
}
