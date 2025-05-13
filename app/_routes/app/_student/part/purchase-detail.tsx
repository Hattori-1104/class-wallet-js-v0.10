import { cva } from "class-variance-authority"
import { Ban, Check, CircleAlert, Flag, X } from "lucide-react"
import { memo } from "react"
import { Link } from "react-router"
import { LightBox } from "~/components/common/box"
import {
	Section,
	SectionContent,
	SectionTitle,
} from "~/components/common/container"
import { Aside } from "~/components/common/placement"
import { Title } from "~/components/common/typography"
import { cn } from "~/lib/utils"
import {
	type PurchaseProcedure,
	partPersonInChargeSelectQuery,
	partWithUserWhereQuery,
	prisma,
	purchaseItemSelectQuery,
	purchaseStateSelectQuery,
} from "~/services/repository.server"
import { verifyStudent } from "~/services/route-module.server"
import { _createErrorRedirect, requireSession } from "~/services/session.server"
import {
	type AdditionalState,
	type State,
	purchaseState,
} from "~/stores/purchase-state"
import type { Route } from "./+types/purchase-detail"

export const loader = async ({
	params: { partId, purchaseId },
	request,
}: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)

	const errorRedirect = await _createErrorRedirect(
		session,
		`/app/student/part/${partId}`,
	)
	const purchase = await prisma.purchase
		.findUniqueOrThrow({
			where: {
				id: purchaseId,
				part: partWithUserWhereQuery(partId, student.id),
			},
			include: {
				state: {
					select: purchaseStateSelectQuery(),
				},
				items: {
					select: purchaseItemSelectQuery(),
				},
				part: {
					select: partPersonInChargeSelectQuery(),
				},
			},
		})
		.catch(errorRedirect("購入情報が見つかりません").catch())
	return { purchase }
}

export default ({ loaderData: { purchase } }: Route.ComponentProps) => {
	const { currentState, instructions, recommended } = purchaseState(purchase)

	const StateBoxFactory = memo(
		({ name, className }: { name: PurchaseProcedure; className?: string }) => {
			return (
				<StateBox
					link={name}
					label={instructions[name].override ?? instructions[name].default}
					state={currentState[name]}
					recommended={recommended === name}
					className={className}
				/>
			)
		},
	)
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
					{currentState.changeReturn.skipped !== true &&
						currentState.receiptSubmission.skipped !== true && (
							<div className="font-bold">完了</div>
						)}
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
	link,
	label,
	state,
	recommended,
	className,
}: {
	link: string
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
		<LightBox
			asChild
			className={cn(
				stateVariants({ baseState: state.baseState, disabled: state.disabled }),
				className,
			)}
		>
			<Link to={link}>
				<Aside gap="xs">
					<Icon />
					<div className="text-center">{label}</div>
				</Aside>
			</Link>
		</LightBox>
	)
}
