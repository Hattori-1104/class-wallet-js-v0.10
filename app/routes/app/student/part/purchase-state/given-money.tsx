import { GivenMoney, parseGivenMoneyAction } from "~/components/page/purchase/given-money"
import { prisma, purchaseStateSelectQuery } from "~/services/repository.server"
import { createErrorRedirect, createSuccessRedirect, requireSession, verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/given-money"

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
	return <GivenMoney purchase={purchase} isRequester={isRequester} />
}

export const action = async (actionArgs: Route.ActionArgs) => {
	const { session, isRequester } = await serverCommon(actionArgs)
	const { partId, purchaseId } = actionArgs.params
	const errorRedirect = createErrorRedirect(session, `/app/student/part/${partId}/purchase/${purchaseId}/givenMoney`)
	if (!isRequester) {
		return await errorRedirect("受取額の入力を行う権限がありません。").throw()
	}
	const { request } = actionArgs

	const formData = await request.formData()
	const result = parseGivenMoneyAction(formData)
	if (result.status !== "success") return result.reply()

	const { givenMoney } = result.value
	const successRedirect = createSuccessRedirect(session, `/app/student/part/${partId}/purchase/${purchaseId}`)
	await prisma.purchase
		.update({
			where: { id: purchaseId },
			data: {
				state: {
					update: {
						givenMoney: {
							upsert: {
								create: { amount: givenMoney },
								update: { amount: givenMoney },
							},
						},
					},
				},
			},
		})
		.catch(errorRedirect("受取額の入力に失敗しました。").catch())
	return await successRedirect("受取額の入力に成功しました。")
}
