import type { Prisma } from "@prisma/client"
import type { purchaseStateSelectQuery } from "~/services/repository.server"
import { formatMoney } from "~/utilities/display"

export type PurchaseProcedure =
	| "request"
	| "accountantApproval"
	| "teacherApproval"
	| "givenMoney"
	| "usageReport"
	| "receiptSubmission"
	| "changeReturn"
export type State = "fulfilled" | "failed" | "pending"
export type AdditionalState = "disabled" | "skipped" | "warning"

type RawPurchaseType = Prisma.PurchaseGetPayload<{
	select: {
		state: { select: ReturnType<typeof purchaseStateSelectQuery> }
	}
}>

export const computePurchaseState = (purchase: RawPurchaseType) => {
	const currentState: Record<PurchaseProcedure, { baseState: State } & { [key in AdditionalState]?: boolean }> = {
		request: { baseState: "pending", disabled: true },
		accountantApproval: { baseState: "pending", disabled: true },
		teacherApproval: { baseState: "pending", disabled: true },
		givenMoney: { baseState: "pending", disabled: true },
		usageReport: { baseState: "pending", disabled: true },
		receiptSubmission: { baseState: "pending", disabled: true },
		changeReturn: { baseState: "pending", disabled: true },
	}
	let recommended: PurchaseProcedure | null = null
	const instructions: Record<PurchaseProcedure, { default: string; override?: string }> = {
		request: { default: "購入リクエスト" },
		accountantApproval: { default: "会計承認" },
		teacherApproval: { default: "教師承認" },
		givenMoney: { default: "現金受け取り" },
		usageReport: { default: "使用額の報告" },
		changeReturn: { default: "お釣り返却" },
		receiptSubmission: { default: "レシート提出" },
	}
	// メインロジック
	const requestState = purchase.state?.request
	const accountantApprovalState = purchase.state?.accountantApproval
	const teacherApprovalState = purchase.state?.teacherApproval
	const givenMoneyState = purchase.state?.givenMoney
	const usageReportState = purchase.state?.usageReport
	const changeReturnState = purchase.state?.changeReturn
	const receiptSubmissionState = purchase.state?.receiptSubmission

	// リクエスト
	if (requestState) {
		currentState.request.disabled = false
		currentState.request.baseState = requestState.approved ? "fulfilled" : "failed"
	} else {
		currentState.request.disabled = false
		currentState.request.warning = true
	}
	// 会計承認
	if (requestState?.approved) {
		currentState.accountantApproval.disabled = false
		if (accountantApprovalState) {
			if (accountantApprovalState.approved) {
				currentState.accountantApproval.baseState = "fulfilled"
			} else {
				currentState.accountantApproval.baseState = "failed"
			}
		}
		if (teacherApprovalState?.approved !== false) {
			recommended = "accountantApproval"
		}
	}
	// 教師承認
	if (requestState?.approved) {
		currentState.teacherApproval.disabled = false
		if (teacherApprovalState) {
			if (teacherApprovalState.approved) {
				currentState.teacherApproval.baseState = "fulfilled"
			} else {
				currentState.teacherApproval.baseState = "failed"
			}
		}
		if (accountantApprovalState?.approved) {
			recommended = "teacherApproval"
		}
	}
	// 現金受け取り
	if (requestState?.approved) {
		if (accountantApprovalState?.approved && teacherApprovalState?.approved) {
			currentState.givenMoney.disabled = false
			if (!usageReportState) {
				recommended = "givenMoney"
			}
			if (givenMoneyState) {
				currentState.givenMoney.baseState = "fulfilled"
				instructions.givenMoney.override = `支給：${formatMoney(givenMoneyState.amount)}`
			}
		}
		if (!givenMoneyState && usageReportState) {
			currentState.givenMoney.skipped = true
		}
	}
	// 使用額の報告
	if (requestState?.approved) {
		currentState.usageReport.disabled = false
		if (usageReportState) {
			currentState.usageReport.baseState = "fulfilled"
			instructions.usageReport.override = `購入：${formatMoney(usageReportState.actualUsage)}`
		}
		if (accountantApprovalState?.approved && teacherApprovalState?.approved) {
			if (givenMoneyState) {
				recommended = "usageReport"
			}
		} else {
			currentState.usageReport.warning = true
		}
	}
	// お釣りの返却（差額の是正）
	if (requestState?.approved) {
		if (teacherApprovalState?.approved && accountantApprovalState?.approved) {
			if (usageReportState) {
				currentState.changeReturn.disabled = false
				const compensation = (givenMoneyState?.amount ?? 0) - usageReportState.actualUsage
				if (compensation === 0) {
					currentState.changeReturn.skipped = true
				}
				if (compensation > 0) {
					instructions.changeReturn.override = `返却：${formatMoney(compensation)}`
				}
				if (compensation < 0) {
					instructions.changeReturn.override = `補填：${formatMoney(-compensation)}`
				}
				if (changeReturnState) {
					currentState.changeReturn.baseState = "fulfilled"
				} else {
					recommended = "changeReturn"
				}
			}
		} else {
			currentState.changeReturn.skipped = true
		}
	}
	// レシート提出
	if (requestState?.approved) {
		if (accountantApprovalState?.approved && teacherApprovalState?.approved) {
			if (usageReportState) {
				currentState.receiptSubmission.disabled = false
				if (receiptSubmissionState) {
					currentState.receiptSubmission.baseState = "fulfilled"
				}
				if (changeReturnState) {
					recommended = "receiptSubmission"
				}
			}
		} else {
			currentState.receiptSubmission.skipped = true
		}
	}

	return { currentState, instructions, recommended }
}

type CommonState = {
	baseState: State
} & { [key in AdditionalState]?: boolean }

interface PurchaseStateCalculatorInterface {
	request: CommonState
	accountantApproval: CommonState
	teacherApproval: CommonState
	givenMoney: CommonState
	usageReport: CommonState
	receiptSubmission: CommonState
	changeReturn: CommonState

	isApproved: "approved" | "rejected" | "pending"
}

// このクラスを完成させよう
export class PurchaseStateCalculator implements PurchaseStateCalculatorInterface {
	constructor(private raw: RawPurchaseType) {}

	// 購入リクエスト
	public get request() {
		// disabledはデフォルトでfalse
		let baseState: State = "pending"
		if (this.raw.state?.request) {
			baseState = this.raw.state.request.approved ? "fulfilled" : "failed"
		}
		return { baseState }
	}

	// 会計承認
	public get accountantApproval() {
		let baseState: State = "pending"
		let disabled = true
		if (this.raw.state?.request?.approved) {
			disabled = false
			if (this.raw.state?.accountantApproval) {
				baseState = this.raw.state.accountantApproval.approved ? "fulfilled" : "failed"
			}
		}
		return { baseState, disabled }
	}

	// 教師承認
	public get teacherApproval() {
		let baseState: State = "pending"
		let disabled = true
		if (this.raw.state?.request?.approved) {
			disabled = false
			if (this.raw.state?.teacherApproval) {
				baseState = this.raw.state.teacherApproval.approved ? "fulfilled" : "failed"
			}
		}
		return { baseState, disabled }
	}

	public get isApproved() {
		const t = this.raw.state.accountantApproval?.approved
		const u = this.raw.state.teacherApproval?.approved
		return t === true && u === true ? "approved" : t === false || u === false ? "rejected" : "pending"
	}

	// 現金受け取り
	public get givenMoney() {
		let baseState: State = "pending"
		let disabled = true

		return { baseState, disabled }
	}
}
