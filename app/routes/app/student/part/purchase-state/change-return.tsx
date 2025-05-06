import { ChangeReturn } from "~/components/page/purchase/change-return"
import { prisma, purchaseStateSelectQuery } from "~/services/repository.server"
import { createErrorRedirect, createSuccessRedirect, verifyStudent } from "~/services/session.server"
import { requireSession } from "~/services/session.server"
import type { Route } from "./+types/change-return"

const serverCommon = async ({ params: { partId, purchaseId }, request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	const purchase = await prisma.purchase.findUniqueOrThrow({
		where: { id: purchaseId, part: { id: partId } },
		include: {
			state: {
				select: purchaseStateSelectQuery(),
			},
		},
	})
	const isRequester = (() => {
		if (!purchase.state.request) {
			return false
		}
		return purchase.state.request.by.id === student.id
	})()
	return { session, student, purchase, isRequester }
}

export const loader = async (loaderArgs: Route.LoaderArgs) => {
	const { purchase, isRequester } = await serverCommon(loaderArgs)
	return { purchase, isRequester }
}

export default ({ loaderData: { purchase, isRequester } }: Route.ComponentProps) => {
	return (
		<ChangeReturn
			givenMoney={purchase.state.givenMoney?.amount ?? null}
			actualUsage={purchase.state.usageReport?.actualUsage ?? null}
			isRequester={isRequester}
			done={purchase.state.changeReturn !== null}
		/>
	)
}

export const action = async (actionArgs: Route.ActionArgs) => {
	const { session, isRequester } = await serverCommon(actionArgs)
	const { partId, purchaseId } = actionArgs.params
	const errorRedirect = createErrorRedirect(session, `/app/student/part/${partId}/purchase/${purchaseId}/changeReturn`)
	if (!isRequester) {
		return await errorRedirect("お釣り返却 / 不足分補填を完了する権限がありません。").throw()
	}
	const successRedirect = createSuccessRedirect(session, `/app/student/part/${partId}/purchase/${purchaseId}`)
	const { request } = actionArgs
	const formData = await request.formData()
	if (formData.get("complete") === "complete") {
		await prisma.purchase
			.update({
				where: { id: purchaseId },
				data: {
					state: {
						update: {
							changeReturn: {
								upsert: {
									create: {},
									update: {},
								},
							},
						},
					},
				},
			})
			.catch(errorRedirect("お釣り返却 / 不足分補填の記録に失敗しました。").catch())
		return successRedirect("お釣り返却 / 不足分補填を記録しました。")
	}
	return await errorRedirect("お釣り返却 / 不足分補填の記録に失敗しました。").throw()
}
