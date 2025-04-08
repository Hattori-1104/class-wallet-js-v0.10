import { useMemo } from "react"
import { redirect } from "react-router"
import { z } from "zod"
import { Section, SectionTitle } from "~/components/common/container"
import { errorRedirect, prisma, successRedirect } from "~/services/repository.server"
import { commitSession, getSession, verifyStudent } from "~/services/session.server"
import { getPurchaseState } from "~/utilities/calc"
import { formatDiffDate } from "~/utilities/display"
import { Certification } from "../new/components/certification"
import type { Route } from "./+types/index"
import { CertificateFormSection } from "./components/certificate-form-section"
import { CertificationSection } from "./components/certification-section"
import { PurchaseItemTable } from "./components/purchase-item-table"
import { TODOSection } from "./components/todo-section"

export const loader = async ({ request, params: { partId, purchaseId } }: Route.LoaderArgs) => {
	const studentId = await verifyStudent(request)
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
		.catch(
			errorRedirect(
				await getSession(request.headers.get("Cookie")),
				`/app/student/part/${partId}`,
				"購入リクエストが存在しません",
			),
		)
	return { purchase, studentId }
}

export default ({ loaderData: { purchase, studentId } }: Route.ComponentProps) => {
	const [inProgress, TODOMessage] = useMemo(() => getPurchaseState(purchase), [purchase])
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
					<p className="text-muted-foreground leading-none">
						最終更新 : {formatDiffDate(purchase.updatedAt ?? purchase.createdAt, Date.now())}
					</p>
				</SectionTitle>
				<PurchaseItemTable purchase={purchase} />
			</Section>
			<CertificationSection>
				<div className="space-y-4">
					<Certification certification={purchase.requestCert} message="購入をリクエスト" />
					<Certification certification={purchase.accountantCert} message="責任者による承認" />
					<Certification certification={purchase.teacherCert} message="教師による承認" />
					<Certification certification={purchase.accountantCert} message="責任者による承認" />
					<Certification certification={purchase.accountantCert} message="責任者による承認" />
				</div>
			</CertificationSection>
			<CertificateFormSection roll={roll} />
		</>
	)
}

const formDataSchema = z.object({ action: z.enum(["refuse", "approve"]), roll: z.enum(["1", "2", "0"]) })

export const action = async ({ request, params: { partId, purchaseId } }: Route.ActionArgs) => {
	const session = await getSession(request.headers.get("Cookie"))
	const formData = await request.formData()
	const { action, roll } = await formDataSchema
		.parseAsync(Object.fromEntries(formData.entries()))
		.catch(errorRedirect(session, `/app/student/part/${partId}`, "購入承認操作に失敗しました。"))

	const studentId = await verifyStudent(request)
	if (roll === "1") {
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
							approved: action === "approve",
							signedBy: {
								connect: {
									id: studentId,
								},
							},
						},
					},
				},
			})
			.catch(errorRedirect(session, `/app/student/part/${partId}`, "購入承認操作に失敗しました。"))
		return successRedirect(
			session,
			`/app/student/part/${partId}`,
			`購入リクエストを${action === "approve" ? "承認" : "拒否"}しました。`,
		)
	}
	if (roll === "2") {
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
							approved: action === "approve",
							signedBy: {
								connect: {
									id: studentId,
								},
							},
						},
					},
				},
			})
			.catch(errorRedirect(session, `/app/student/part/${partId}`, "購入承認操作に失敗しました。"))
		return successRedirect(
			session,
			`/app/student/part/${partId}`,
			`購入リクエストを${action === "approve" ? "承認" : "拒否"}しました。`,
		)
	}
	session.flash("error", { message: "購入承認操作を行う権限ありません。" })
	return redirect(`/app/student/part/${partId}`, { headers: { "Set-Cookie": await commitSession(session) } })
}
