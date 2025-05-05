import { AccountantApproval, parseAccountantApprovalAction } from "~/components/page/purchase/accountant-approval"
import { prisma, purchaseStateSelectQuery } from "~/services/repository.server"
import { createErrorRedirect, createSuccessRedirect, requireSession } from "~/services/session.server"
import { verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/accountant-approval"

// サーバー共通処理
const serverCommon = async ({ params: { partId, purchaseId }, request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	const purchase = await prisma.purchase.findUniqueOrThrow({
		where: { id: purchaseId, part: { id: partId } },
		include: {
			part: {
				select: {
					leaders: {
						select: {
							id: true,
						},
					},
					wallet: {
						select: {
							accountantStudents: {
								select: {
									id: true,
								},
							},
						},
					},
				},
			},
			state: { select: purchaseStateSelectQuery() },
		},
	})
	const isInCharge =
		purchase.part.leaders.some((leader) => leader.id === student.id) ||
		purchase.part.wallet.accountantStudents.some((accountant) => accountant.id === student.id)
	return { session, student, purchase, isInCharge }
}

export const loader = async (loaderArgs: Route.LoaderArgs) => {
	const { purchase, isInCharge } = await serverCommon(loaderArgs)
	return { purchase, isInCharge }
}

export default ({ loaderData: { purchase, isInCharge } }: Route.ComponentProps) => {
	return <AccountantApproval purchase={purchase} isInCharge={isInCharge} />
}

export const action = async (actionArgs: Route.ActionArgs) => {
	const { session, student, isInCharge } = await serverCommon(actionArgs)
	const {
		params: { partId, purchaseId },
	} = actionArgs
	const errorRedirect = createErrorRedirect(
		session,
		`/app/student/part/${partId}/purchase/${purchaseId}/accountantApproval`,
	)
	if (!isInCharge) {
		return await errorRedirect("承認を操作する権限がありません。").throw()
	}
	const { request } = actionArgs

	const formData = await request.formData()
	const result = parseAccountantApprovalAction(formData)
	if (result.status !== "success") return result.reply()

	const { action } = result.value

	const successRedirect = createSuccessRedirect(session, `/app/student/part/${partId}/purchase/${purchaseId}`)

	if (action === "approve") {
		await prisma.purchase
			.update({
				where: { id: purchaseId },
				data: {
					state: {
						update: {
							accountantApproval: {
								upsert: {
									create: { approved: true, by: { connect: { id: student.id } } },
									update: { approved: true },
								},
							},
						},
					},
				},
			})
			.catch(errorRedirect("承認に失敗しました。").catch())
		return await successRedirect("承認しました。")
	}
	if (action === "reject") {
		await prisma.purchase
			.update({
				where: { id: purchaseId },
				data: {
					state: {
						upsert: {
							create: {
								accountantApproval: {
									create: { approved: false, by: { connect: { id: student.id } } },
								},
							},
							update: {
								accountantApproval: {
									update: { approved: false },
								},
							},
						},
					},
				},
			})
			.catch(errorRedirect("承認の拒否に失敗しました。").catch())
		return await successRedirect("承認を拒否しました。")
	}
}
