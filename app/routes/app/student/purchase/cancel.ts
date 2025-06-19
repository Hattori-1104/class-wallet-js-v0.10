import { redirect } from "react-router"
import { entryStudentPurchaseRoute } from "~/route-modules/common.server"
import { queryIsRequester } from "~/route-modules/purchase-state/common.server"
import { prisma } from "~/services/repository.server"
import { commitSession } from "~/services/session.server"
import type { Route } from "./+types/cancel"

export const action = async ({ request, params }: Route.ActionArgs) => {
	console.log("削除")
	const { session, partId, purchaseId, student } = await entryStudentPurchaseRoute(request, params.purchaseId)
	const isRequester = await queryIsRequester(purchaseId, student.id)
	if (!isRequester) return null
	console.log("削除2")
	await prisma.purchase.delete({
		where: {
			id: purchaseId,
		},
	})
	session.flash("success", { message: "購入を削除しました。" })
	return redirect(`/app/student/part/${partId}`, { headers: { "Set-Cookie": await commitSession(session) } })
}
