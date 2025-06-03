import type { Prisma } from "@prisma/client"

type PurchaseWithState = Prisma.PurchaseGetPayload<{
	select: {
		canceled: true
		accountantApproval: {
			select: {
				approved: true
			}
		}
		teacherApproval: {
			select: {
				approved: true
			}
		}
		completion: { select: never }
		receiptSubmission: { select: never }
	}
}>

export type PurchaseAction =
	| "approval"
	| "completion"
	| "receiptSubmission"
	| "completed"

export class PurchaseState {
	constructor(private purchase: PurchaseWithState) {}

	public get isCanceled() {
		return this.purchase.canceled
	}

	public get recommendedAction() {
		const { canceled, accountantApproval, teacherApproval, completion } =
			this.purchase
		if (canceled) {
			return "approval" as const
		}
		if (
			accountantApproval?.approved !== true ||
			teacherApproval?.approved !== true
		) {
			return "approval" as const
		}
		if (!completion) {
			return "completion" as const
		}
		return "receiptSubmission" as const
	}

	public get actionResult() {
		return {
			approval: this._actionResultApproval,
			completion: this._actionResultCompletion,
			receiptSubmission: this._actionResultReceiptSubmission,
		} as const
	}
	private get _actionResultApproval() {
		const { accountantApproval, teacherApproval } = this.purchase
		if (
			accountantApproval?.approved === false ||
			teacherApproval?.approved === false
		)
			return "rejected"
		if (
			accountantApproval?.approved === true &&
			teacherApproval?.approved === true
		)
			return "approved"
		return "pending"
	}
	private get _actionResultCompletion() {
		if (this._actionResultApproval !== "approved") return "disabled"
		const { completion } = this.purchase
		return completion ? "fulfilled" : "pending"
	}
	private get _actionResultReceiptSubmission() {
		if (this._actionResultApproval !== "approved") return "disabled"
		if (this._actionResultCompletion !== "fulfilled") return "disabled"
		const { receiptSubmission } = this.purchase
		return receiptSubmission ? "fulfilled" : "pending"
	}
}

export function recommendedAction({
	canceled,
	accountantApproval,
	teacherApproval,
	completion,
	receiptSubmission,
}: PurchaseWithState): PurchaseAction {
	if (canceled) {
		return "approval" as const
	}
	if (
		accountantApproval?.approved !== true ||
		teacherApproval?.approved !== true
	) {
		return "approval" as const
	}
	if (!completion) {
		return "completion" as const
	}
	if (!receiptSubmission) {
		return "receiptSubmission" as const
	}
	return "completed" as const
}
