import { Request, parseRequestAction } from "~/components/page/purchase/request"
import { prisma, purchaseStateSelectQuery } from "~/services/repository.server"
import { verifyStudent } from "~/services/route-module.server"
import {
	_createErrorRedirect,
	_createSuccessRedirect,
	requireSession,
} from "~/services/session.server"
import type { Route } from "./+types/request"

// サーバー共通処理
const serverCommon = async ({
	request,
	params: { partId, purchaseId },
}: Route.ActionArgs) => {
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

export default ({
	loaderData: { purchase, isRequester },
}: Route.ComponentProps) => {
	return <Request purchase={purchase} isRequester={isRequester} />
}

export const action = async (actionArgs: Route.ActionArgs) => {
	const { session, student, isRequester } = await serverCommon(actionArgs)
	const {
		params: { partId, purchaseId },
	} = actionArgs
	const errorRedirect = _createErrorRedirect(
		session,
		`/app/student/part/${partId}/purchase/${purchaseId}/request`,
	)
	if (!isRequester) {
		return await errorRedirect("リクエストを操作する権限がありません。").throw()
	}
	const { request } = actionArgs

	const formData = await request.formData()
	const result = parseRequestAction(formData)
	if (result.status !== "success") return result.reply()

	const { action } = result.value

	const successRedirect = _createSuccessRedirect(
		session,
		`/app/student/part/${partId}/purchase/${purchaseId}`,
	)

	if (action === "cancel") {
		await prisma.purchase
			.update({
				where: { id: purchaseId },
				data: {
					state: {
						update: {
							request: {
								upsert: {
									create: {
										approved: false,
										by: {
											connect: {
												id: student.id,
											},
										},
									},
									update: {
										approved: false,
									},
								},
							},
						},
					},
				},
			})
			.catch(errorRedirect("購入リクエストの取り消しに失敗しました。").catch())
		return await successRedirect("購入リクエストを取り消しました。")
	}
	if (action === "request") {
		await prisma.purchase
			.update({
				where: { id: purchaseId },
				data: {
					state: {
						update: {
							request: {
								upsert: {
									create: {
										approved: true,
										by: {
											connect: {
												id: student.id,
											},
										},
									},
									update: {
										approved: true,
									},
								},
							},
						},
					},
				},
			})
			.catch(errorRedirect("購入のリクエストに失敗しました。").catch())
		return await successRedirect("購入をリクエストしました")
	}
}
