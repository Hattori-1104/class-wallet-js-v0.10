import { useMemo } from "react"
import { z } from "zod"
import { Section } from "~/components/common/container"
import { SectionTitle } from "~/components/common/container"
import { createErrorRedirect, createSuccessRedirect, prisma } from "~/services/repository.server"
import { getSession, verifyTeacher } from "~/services/session.server"
import { getPurchaseState } from "~/utilities/calc"
import { formatDiffDate } from "~/utilities/display"
import type { Route } from "./+types/index"
import { CertificateFormSection } from "./components/certificate-form-section"
import { Certification } from "./components/certification"
import { CertificationSection } from "./components/certification-section"
import { PurchaseItemTable } from "./components/purchase-item-table"
import { TODOSection } from "./components/todo-section"

export const loader = async ({ request, params: { purchaseId, walletId } }: Route.LoaderArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const teacherId = await verifyTeacher(session)
	const errorRedirect = createErrorRedirect(session, "/app/teacher/wallet")
	const purchase = await prisma.purchase
		.findUniqueOrThrow({
			where: { id: purchaseId, part: { wallet: { id: walletId, teachers: { some: { id: teacherId } } } } },
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
	return { purchase }
}

export default ({ loaderData: { purchase } }: Route.ComponentProps) => {
	const [inProgress, TODOMessage] = useMemo(() => getPurchaseState(purchase), [purchase])
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
				</div>
			</CertificationSection>
			<CertificateFormSection />
		</>
	)
}
const formDataSchema = z.object({ action: z.enum(["refuse", "approve"]) })

export const action = async ({ request, params: { purchaseId, walletId } }: Route.ActionArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const teacherId = await verifyTeacher(session)
	const errorRedirect = createErrorRedirect(session, `/app/teacher/wallet/${walletId}`)
	const successRedirect = createSuccessRedirect(session, `/app/teacher/wallet/${walletId}`)
	const formData = await request.formData()
	const { action } = await formDataSchema.parseAsync(Object.fromEntries(formData.entries())).catch(errorRedirect("購入承認操作に失敗しました。").catch())
	await prisma.purchase
		.update({
			where: { id: purchaseId, part: { wallet: { id: walletId, teachers: { some: { id: teacherId } } } } },
			data: {
				teacherCert: {
					create: {
						approved: action === "approve",
						signedBy: {
							connect: {
								id: teacherId,
							},
						},
					},
				},
			},
		})
		.catch(errorRedirect("購入承認操作に失敗しました。").catch())
	return successRedirect(`購入リクエストを${action === "approve" ? "承認" : "拒否"}しました。`)
}
