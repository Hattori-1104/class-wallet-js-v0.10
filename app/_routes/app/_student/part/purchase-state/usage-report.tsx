import { purchaseStateSelectQuery } from "~/services/repository.server"

import { prisma } from "~/services/repository.server"
import { verifyStudent } from "~/services/route-module.server"
import {
	_createErrorRedirect,
	_createSuccessRedirect,
} from "~/services/session.server"

import {
	UsageReport,
	parseUsageReportAction,
} from "~/components/page/purchase/usage-report"
import { requireSession } from "~/services/session.server"
import type { Route } from "./+types/usage-report"

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
	return <UsageReport purchase={purchase} isRequester={isRequester} />
}

export const action = async (actionArgs: Route.ActionArgs) => {
	const { session, isRequester, purchase } = await serverCommon(actionArgs)
	const { partId, purchaseId } = actionArgs.params
	const errorRedirect = _createErrorRedirect(
		session,
		`/app/student/part/${partId}/purchase/${purchaseId}/usageReport`,
	)
	if (!isRequester) {
		return await errorRedirect("使用額の報告を行う権限がありません。").throw()
	}

	const { request } = actionArgs
	const formData = await request.formData()
	const result = parseUsageReportAction(formData)
	if (result.status !== "success") return result.reply()

	const { actualUsage } = result.value
	const successRedirect = _createSuccessRedirect(
		session,
		`/app/student/part/${partId}/purchase/${purchaseId}`,
	)
	await prisma
		.$transaction(async (tx) => {
			if (actualUsage === purchase.plannedUsage) {
				await tx.purchase.update({
					where: { id: purchaseId },
					data: {
						state: {
							update: {
								usageReport: {
									upsert: {
										create: { actualUsage },
										update: { actualUsage },
									},
								},
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
			} else {
				await tx.purchase.update({
					where: { id: purchaseId },
					data: {
						state: {
							update: {
								usageReport: {
									upsert: {
										create: { actualUsage },
										update: { actualUsage },
									},
								},
							},
						},
					},
				})
			}
		})
		.catch(errorRedirect("使用額の報告に失敗しました。").catch())

	return await successRedirect("使用額の報告に成功しました。")
}
