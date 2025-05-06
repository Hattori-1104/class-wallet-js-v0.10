import { AccountantApproval } from "~/components/page/purchase/accountant-approval"
import { prisma, purchaseStateSelectQuery } from "~/services/repository.server"
import { createErrorRedirect, requireSession, verifyTeacher } from "~/services/session.server"
import type { Route } from "./+types/accountant-approval"

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
	return <AccountantApproval purchase={purchase} isInCharge={false} />
}
