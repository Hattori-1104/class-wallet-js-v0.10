import { useMemo } from "react"
import { z } from "zod"
import { Section, SectionTitle } from "~/components/common/container"
import { prisma } from "~/services/repository.server"
import { createErrorRedirect, createSuccessRedirect } from "~/services/session.server"
import { getSession, verifyStudent } from "~/services/session.server"
import { getPurchasePlannedUsage, getPurchaseState } from "~/utilities/calc"
import { formatDiffDate, formatMoney } from "~/utilities/display"
import type { Route } from "./+types/index"
import { CertificateFormSection } from "./components/certificate-form-section"
import { Certification } from "./components/certification"
import { CertificationSection } from "./components/certification-section"
import { Confirmation } from "./components/confirmation"
import { PurchaseItemTable } from "./components/purchase-item-table"
import { ReportFormSection } from "./components/report-form-section"
import { TODOSection } from "./components/todo-section"

export const loader = async ({ request, params: { partId, purchaseId } }: Route.LoaderArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const studentId = await verifyStudent(session)
	const errorRedirect = createErrorRedirect(session, `/app/student/part/${partId}`)
	const purchase = await prisma.purchase
		.findUniqueOrThrow({
			where: {
				id: purchaseId,
				part: {
					id: partId,
					students: {
						some: {
							id: studentId,
						},
					},
				},
			},
			select: {
				id: true,
				label: true,
				actualUsage: true,
				createdAt: true,
				updatedAt: true,
				items: {
					select: {
						id: true,
						product: {
							select: {
								id: true,
								name: true,
								price: true,
							},
						},
						quantity: true,
					},
				},
				requestCert: {
					select: {
						id: true,
						signedBy: {
							select: {
								id: true,
								name: true,
							},
						},
						createdAt: true,
						approved: true,
					},
				},
				accountantCert: {
					select: {
						id: true,
						signedBy: {
							select: {
								id: true,
								name: true,
							},
						},
						createdAt: true,
						approved: true,
					},
				},
				teacherCert: {
					select: {
						id: true,
						signedBy: {
							select: {
								id: true,
								name: true,
							},
						},
						createdAt: true,
						approved: true,
					},
				},
				reportedAt: true,
				returnedAt: true,
				completedAt: true,
				part: {
					select: {
						id: true,
						name: true,
						leaders: {
							select: {
								id: true,
								name: true,
							},
						},
						wallet: {
							select: {
								accountantStudents: {
									select: {
										id: true,
										name: true,
									},
								},
							},
						},
					},
				},
			},
		})
		.catch(errorRedirect("購入リクエストが存在しません。").catch())
	return { purchase, studentId }
}

export default ({ loaderData: { purchase, studentId } }: Route.ComponentProps) => {
	const [inProgress, TODOMessage, state] = useMemo(() => getPurchaseState(purchase), [purchase])
	const plannedUsage = useMemo(() => getPurchasePlannedUsage(purchase), [purchase])
	const roll = new Set(purchase.part.leaders.map((leader) => leader.id)).has(studentId)
		? 1
		: new Set(purchase.part.wallet.accountantStudents.map((accountant) => accountant.id)).has(studentId)
			? 2
			: 0
	return (
		<>
			<TODOSection inProgress={inProgress} message={TODOMessage} />
			<Section>
				<SectionTitle className="flex flex-row justify-between items-baseline flex-wrap">
					<h1 className="font-bold text-lg">{purchase.label}</h1>
					<p className="text-muted-foreground leading-none">最終更新 : {formatDiffDate(purchase.updatedAt ?? purchase.createdAt, Date.now())}</p>
				</SectionTitle>
				<PurchaseItemTable purchase={purchase} />
			</Section>
			<CertificationSection>
				<div className="space-y-4">
					<Certification certification={purchase.requestCert} message="購入をリクエスト" />
					<Certification certification={purchase.accountantCert} message="責任者による承認" />
					<Certification certification={purchase.teacherCert} message="教師による承認" />
					<Confirmation completedAt={purchase.reportedAt} completedBy={purchase.requestCert.signedBy.name} message="買い出しを完了" />
				</div>
			</CertificationSection>
			{state === "accountant-waiting" && <CertificateFormSection roll={roll} />}
			{state === "purchase-waiting" && <ReportFormSection plannedUsage={plannedUsage} />}
			{state === "return-waiting" && (
				<div className="space-y-4">
					<div className="flex flex-row justify-between">
						<span className="font-bold">実際の使用額：</span>
						<span className="font-bold">{formatMoney(Number(purchase.actualUsage || 0))}</span>
					</div>
					<div className="flex flex-row justify-between">
						<span className="font-bold">お釣り：</span>
						<span className="font-bold">{formatMoney(plannedUsage - Number(purchase.actualUsage || 0))}</span>
					</div>
				</div>
			)}
		</>
	)
}

const approvalFormDataSchema = z.object({ action: z.enum(["refuse", "approve"]), roll: z.enum(["1", "2", "0"]) })

export const action = async ({ request, params: { partId, purchaseId } }: Route.ActionArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const formData = await request.formData()
	const errorRedirect = createErrorRedirect(session, `/app/student/part/${partId}`)
	const successRedirect = createSuccessRedirect(session, `/app/student/part/${partId}`)
	const intent = formData.get("intent")
	const studentId = await verifyStudent(session)
	if (intent === "approval") {
		const result = await approvalFormDataSchema.parseAsync(Object.fromEntries(formData.entries())).catch(errorRedirect("購入承認操作に失敗しました。").catch())
		if (result.roll === "1") {
			await prisma.purchase
				.update({
					where: {
						id: purchaseId,
						part: {
							leaders: {
								some: {
									id: studentId,
								},
							},
						},
					},
					data: {
						accountantCert: {
							create: {
								approved: result.action === "approve",
								signedBy: {
									connect: {
										id: studentId,
									},
								},
							},
						},
					},
				})
				.catch(errorRedirect("購入承認操作に失敗しました。").catch())
			return successRedirect(`購入リクエストを${result.action === "approve" ? "承認" : "拒否"}しました。`)
		}
		if (result.roll === "2") {
			await prisma.purchase
				.update({
					where: {
						id: purchaseId,
						part: {
							wallet: {
								accountantStudents: {
									some: {
										id: studentId,
									},
								},
							},
						},
					},
					data: {
						accountantCert: {
							create: {
								approved: result.action === "approve",
								signedBy: {
									connect: {
										id: studentId,
									},
								},
							},
						},
					},
				})
				.catch(errorRedirect("購入承認操作に失敗しました。").catch())
			return successRedirect(`購入リクエストを${result.action === "approve" ? "承認" : "拒否"}しました。`)
		}
		errorRedirect("購入承認操作を行う権限がありません。").throw()
	}
	if (intent === "report") {
		const actualUsage = Number(formData.get("actualUsage"))
		// 実際の使用額と予定額が一致した場合、購入完了とする
		const purchase = await prisma.purchase.findUniqueOrThrow({
			where: { id: purchaseId },
			select: { items: { select: { product: { select: { price: true } }, quantity: true } } },
		})
		if (actualUsage === getPurchasePlannedUsage(purchase)) {
			await prisma.purchase.update({ where: { id: purchaseId }, data: { actualUsage, reportedAt: new Date(), completedAt: new Date() } })
			return successRedirect("購入を完了しました。")
		}
		await prisma.purchase.update({ where: { id: purchaseId }, data: { actualUsage, reportedAt: new Date() } })
		return successRedirect("使用額を報告しました。")
	}
	errorRedirect("操作を行う権限がありません。").throw()
}
