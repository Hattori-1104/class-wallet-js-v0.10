import {
	TeacherApproval,
	parseTeacherApprovalAction,
} from "~/components/page/purchase/teacher-approval"
import { prisma, purchaseStateSelectQuery } from "~/services/repository.server"
import {
	_createErrorRedirect,
	_createSuccessRedirect,
	requireSession,
	verifyTeacher,
} from "~/services/session.server"
import type { Route } from "./+types/teacher-approval"

const serverCommon = async ({
	request,
	params: { walletId, purchaseId },
}: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const teacher = await verifyTeacher(session)
	const purchase = await prisma.purchase.findUniqueOrThrow({
		where: { id: purchaseId, part: { wallet: { id: walletId } } },
		include: {
			state: {
				select: purchaseStateSelectQuery(),
			},
			part: {
				select: {
					wallet: {
						select: {
							teachers: {
								select: {
									id: true,
								},
							},
						},
					},
				},
			},
		},
	})
	const isInCharge = purchase.part.wallet.teachers.some(
		(t) => t.id === teacher.id,
	)
	return { session, purchase, isInCharge, teacher }
}

export const loader = async (loaderArgs: Route.LoaderArgs) => {
	const { purchase, isInCharge } = await serverCommon(loaderArgs)
	return { purchase, isInCharge }
}

export default ({
	loaderData: { purchase, isInCharge },
}: Route.ComponentProps) => {
	return <TeacherApproval purchase={purchase} isInCharge={isInCharge} />
}

export const action = async (actionArgs: Route.ActionArgs) => {
	const { session, isInCharge, teacher } = await serverCommon(actionArgs)
	const {
		params: { walletId, purchaseId },
	} = actionArgs
	const errorRedirect = _createErrorRedirect(
		session,
		`/app/teacher/wallet/${walletId}/purchase/${purchaseId}`,
	)
	if (!isInCharge) {
		return await errorRedirect("承認を操作する権限がありません。").throw()
	}
	const { request } = actionArgs

	const formData = await request.formData()
	const result = parseTeacherApprovalAction(formData)
	if (result.status !== "success") return result.reply()

	const { action } = result.value

	const successRedirect = _createSuccessRedirect(
		session,
		`/app/teacher/wallet/${walletId}/purchase/${purchaseId}`,
	)

	if (action === "approve") {
		await prisma.purchase
			.update({
				where: { id: purchaseId },
				data: {
					state: {
						update: {
							teacherApproval: {
								upsert: {
									create: {
										approved: true,
										by: { connect: { id: teacher.id } },
									},
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
						update: {
							teacherApproval: {
								upsert: {
									create: {
										approved: false,
										by: { connect: { id: teacher.id } },
									},
									update: { approved: false },
								},
							},
						},
					},
				},
			})
			.catch(errorRedirect("拒否に失敗しました。").catch())
		return await successRedirect("拒否しました。")
	}
}
