import type { Prisma } from "@prisma/client"
import { prisma } from "~/services/repository.server"
import {
	type SessionStorage,
	buildErrorRedirect,
	buildSuccessRedirect,
} from "~/services/session.server"

export const PurchaseApprovalSelectQuery = {
	id: true,
	label: true,
	canceled: true,
	accountantApproval: {
		select: {
			by: {
				select: {
					name: true,
				},
			},
			at: true,
			approved: true,
		},
	},
	teacherApproval: {
		select: {
			by: {
				select: {
					name: true,
				},
			},
			at: true,
			approved: true,
		},
	},
} satisfies Prisma.PurchaseSelect
export type PurchaseApprovalSelectQuery = typeof PurchaseApprovalSelectQuery

// Discriminated union types for purchase approval
export type StudentApprovalAction = {
	type: "student"
	purchaseId: string
	studentId: string
	partId: string
	action: "approve" | "reject"
	session: SessionStorage
}

export type TeacherApprovalAction = {
	type: "teacher"
	purchaseId: string
	teacherId: string
	walletId: string
	action: "approve" | "reject"
	session: SessionStorage
}

export type ApprovalAction = StudentApprovalAction | TeacherApprovalAction

// Overloaded function signatures for purchase approval
export async function processPurchaseApproval(
	action: StudentApprovalAction,
): Promise<Response>
export async function processPurchaseApproval(
	action: TeacherApprovalAction,
): Promise<Response>
export async function processPurchaseApproval(
	actionData: ApprovalAction,
): Promise<Response> {
	if (actionData.type === "student") {
		const errorRedirect = buildErrorRedirect(
			`/app/student/part/${actionData.partId}`,
			actionData.session,
		)
		const successRedirect = buildSuccessRedirect(
			`/app/student/part/${actionData.partId}/purchase/${actionData.purchaseId}`,
			actionData.session,
		)

		if (actionData.action === "approve") {
			await prisma.purchase
				.update({
					where: { id: actionData.purchaseId },
					data: {
						accountantApproval: {
							upsert: {
								update: {
									by: { connect: { id: actionData.studentId } },
									approved: true,
								},
								create: {
									by: { connect: { id: actionData.studentId } },
									approved: true,
								},
							},
						},
					},
				})
				.catch(() => errorRedirect("購入の承認に失敗しました。"))
			return successRedirect("購入を承認しました。")
		}

		if (actionData.action === "reject") {
			await prisma.purchase
				.update({
					where: { id: actionData.purchaseId },
					data: {
						accountantApproval: {
							update: {
								by: { connect: { id: actionData.studentId } },
								approved: false,
							},
						},
					},
				})
				.catch(() => errorRedirect("購入の拒否に失敗しました。"))
			return successRedirect("購入を拒否しました。")
		}

		// Exhaustive check
		const _exhaustiveCheck: never = actionData.action
		throw new Error(`Unhandled action: ${_exhaustiveCheck}`)
	}

	const errorRedirect = buildErrorRedirect(
		`/app/teacher/wallet/${actionData.walletId}`,
		actionData.session,
	)
	const successRedirect = buildSuccessRedirect(
		`/app/teacher/wallet/${actionData.walletId}/purchase/${actionData.purchaseId}`,
		actionData.session,
	)

	if (actionData.action === "approve") {
		await prisma.purchase
			.update({
				where: { id: actionData.purchaseId },
				data: {
					teacherApproval: {
						upsert: {
							update: {
								by: { connect: { id: actionData.teacherId } },
								approved: true,
							},
							create: {
								by: { connect: { id: actionData.teacherId } },
								approved: true,
							},
						},
					},
				},
			})
			.catch(() => errorRedirect("購入の承認に失敗しました。"))
		return successRedirect("購入を承認しました。")
	}

	if (actionData.action === "reject") {
		await prisma.purchase
			.update({
				where: { id: actionData.purchaseId },
				data: {
					teacherApproval: {
						update: {
							by: { connect: { id: actionData.teacherId } },
							approved: false,
						},
					},
				},
			})
			.catch(() => errorRedirect("購入の拒否に失敗しました。"))
		return successRedirect("購入を拒否しました。")
	}

	// Exhaustive check
	const _exhaustiveCheck: never = actionData.action
	throw new Error(`Unhandled action: ${_exhaustiveCheck}`)
}
