import { cva } from "class-variance-authority"
import { Ban, Check, CircleAlert, Flag, X } from "lucide-react"
import { memo, useMemo } from "react"
import { LightBox } from "~/components/common/box"
import { Section, SectionContent, SectionTitle } from "~/components/common/container"
import { Aside } from "~/components/common/placement"
import { Title } from "~/components/common/typography"
import { cn } from "~/lib/utils"
import {
	type PurchaseProcedure,
	partWithUserWhereQuery,
	prisma,
	purchaseStateAllSelectQuery,
	queryIsAccountant,
	queryIsLeader,
} from "~/services/repository.server"
import { createErrorRedirect, requireSession, verifyStudent } from "~/services/session.server"
import type { Route } from "./+types/purchase-detail"

export const loader = async ({ params: { partId, purchaseId }, request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)

	const errorRedirect = await createErrorRedirect(session, `/app/student/part/${partId}`)
	const purchase = await prisma.purchase
		.findUniqueOrThrow({
			where: {
				id: purchaseId,
				part: {
					...partWithUserWhereQuery(partId, student.id),
				},
				state: { isNot: null },
			},
			select: {
				id: true,
				label: true,
				createdAt: true,
				updatedAt: true,
				plannedUsage: true,
				items: {
					select: {
						id: true,
						quantity: true,
						product: {
							select: {
								id: true,
								name: true,
								price: true,
							},
						},
					},
				},
				state: {
					select: {
						...purchaseStateAllSelectQuery(),
					},
				},
			},
		})
		.catch(errorRedirect("購入情報が見つかりません").catch())
	const isLeader = await queryIsLeader(partId, student.id)
	const isAccountant = await queryIsAccountant(partId, student.id)
	purchase.state
	return { purchase, isLeader, isAccountant }
}

type State = "fulfilled" | "failed" | "pending"
type AdditionalState = "disabled" | "skipped" | "warning"

export default ({ loaderData: { purchase, isLeader, isAccountant } }: Route.ComponentProps) => {
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: 状態の条件分岐
	const { currentState, instructions, recommended } = useMemo(() => {
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
		const instructions: Record<PurchaseProcedure, { default: string; overridden?: string }> = {
			request: { default: "購入リクエスト" },
			accountantApproval: { default: "会計承認" },
			teacherApproval: { default: "教師承認" },
			givenMoney: { default: "現金受け取り" },
			usageReport: { default: "使用額の報告" },
			changeReturn: { default: "お釣り返却" },
			receiptSubmission: { default: "レシート提出" },
		}
		// メインロジック
		const requestState = purchase.state?.requests?.[0]
		const accountantApprovalState = purchase.state?.accountantApprovals?.[0]
		const teacherApprovalState = purchase.state?.teacherApprovals?.[0]
		const givenMoneyState = purchase.state?.givenMoneys?.[0]
		const usageReportState = purchase.state?.usageReports?.[0]
		const changeReturnState = purchase.state?.changeReturns?.[0]
		const receiptSubmissionState = purchase.state?.receiptSubmissions?.[0]

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
		} else {
			currentState.accountantApproval.disabled = false
			currentState.accountantApproval.baseState = "failed"
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
		} else {
			currentState.teacherApproval.disabled = false
			currentState.teacherApproval.baseState = "failed"
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
			if (usageReportState) {
				currentState.changeReturn.disabled = false
				if (changeReturnState) {
					currentState.changeReturn.baseState = "fulfilled"
				} else {
					recommended = "changeReturn"
				}
			}
		}
		// レシート提出
		if (requestState?.approved) {
			if (usageReportState) {
				currentState.receiptSubmission.disabled = false
				if (receiptSubmissionState) {
					currentState.receiptSubmission.baseState = "fulfilled"
				}
				if (changeReturnState) {
					recommended = "receiptSubmission"
				}
			}
		}

		return { currentState, instructions, recommended }
	}, [purchase.state])

	const StateBoxFactory = memo(({ name, className }: { name: PurchaseProcedure; className?: string }) => {
		return (
			<StateBox
				label={instructions[name].overridden ?? instructions[name].default}
				state={currentState[name]}
				recommended={recommended === name}
				className={className}
			/>
		)
	})
	return (
		<Section>
			<SectionTitle>
				<Title>{purchase.label}</Title>
			</SectionTitle>
			<SectionContent>
				<div className="flex flex-col gap-2">
					<div className="font-bold">承認</div>
					<div className="flex flex-col gap-2">
						<StateBoxFactory name="request" className="col-span-2" />
						<Aside gap="sm">
							<StateBoxFactory name="accountantApproval" />
							<StateBoxFactory name="teacherApproval" />
						</Aside>
						<StateBoxFactory name="givenMoney" />
					</div>
					<div className="font-bold">購入</div>
					<Aside gap="sm">
						<StateBoxFactory name="usageReport" />
					</Aside>
					<div className="font-bold">完了</div>
					<Aside gap="sm">
						<StateBoxFactory name="changeReturn" />
						<StateBoxFactory name="receiptSubmission" />
					</Aside>
				</div>
			</SectionContent>
		</Section>
	)
}

function StateBox({
	label,
	state,
	recommended,
	className,
}: {
	label: string
	state: { baseState: State } & { [key in AdditionalState]?: boolean }
	recommended?: boolean
	className?: string
}) {
	if (state.skipped) return null
	const stateVariants = cva("px-2 flex items-center justify-center w-full", {
		variants: {
			baseState: {
				fulfilled: "text-positive border-positive",
				failed: "text-destructive border-destructive",
				pending: "text-muted-foreground",
			},
			disabled: {
				true: "text-muted-foreground border-muted-foreground",
			},
		},
	})
	const Icon = memo(() => {
		if (state.disabled) return <Ban size={16} />
		if (state.warning) return <CircleAlert size={16} />
		if (state.baseState === "fulfilled") return <Check size={16} />
		if (state.baseState === "failed") return <X size={16} />
		if (state.baseState === "pending" && recommended) return <Flag size={16} />
	})
	return (
		<LightBox className={cn(stateVariants({ baseState: state.baseState, disabled: state.disabled }), className)}>
			<Aside gap="xs">
				<Icon />
				<div className="text-center">{label}</div>
			</Aside>
		</LightBox>
	)
}
