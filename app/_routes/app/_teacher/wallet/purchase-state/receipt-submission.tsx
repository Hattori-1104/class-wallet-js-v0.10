import { verifyTeacher } from "~/services/session.server"

import { requireSession } from "~/services/session.server"

import { prisma } from "~/services/repository.server"

import { ReceiptSubmission } from "~/components/page/purchase/receipt-submission"
import { purchaseStateSelectQuery } from "~/services/repository.server"
import { _createErrorRedirect } from "~/services/session.server"
import type { Route } from "./+types/receipt-submission"

export const loader = async ({
	request,
	params: { walletId, purchaseId },
}: Route.LoaderArgs) => {
	const session = await requireSession(request)
	await verifyTeacher(session)
	const errorRedirect = _createErrorRedirect(
		session,
		`/app/teacher/wallet/${walletId}/purchase/${purchaseId}`,
	)
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
	return <ReceiptSubmission purchase={purchase} isRequester={false} />
}
