import { parseWithZod } from "@conform-to/zod"
import { data } from "react-router"
import { SectionContent, SectionTitle } from "~/components/common/container"
import { Section } from "~/components/common/container"
import { entryStudentRoute } from "~/route-modules/common.server"
import { queryIsRequester } from "~/route-modules/purchase-state/common.server"
import { PurchaseCompletionSectionContent, formSchema } from "~/route-modules/purchase-state/completion"
import { PurchaseCompletionSelectQuery } from "~/route-modules/purchase-state/completion.server"
import { prisma } from "~/services/repository.server"
import { sendPushNotification } from "~/services/send-notification.server"
import { buildSuccessRedirect, commitSession } from "~/services/session.server"
import { formatCurrency } from "~/utilities/display"
import type { Route } from "./+types/completion"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { partId, student } = await entryStudentRoute(request, params.partId)

	// TODO: エラーハンドリング
	const purchase = await prisma.purchase.findUniqueOrThrow({
		where: {
			id: params.purchaseId,
			part: { id: partId, students: { some: { id: student.id } } },
		},
		select: PurchaseCompletionSelectQuery,
	})
	const isRequester = await queryIsRequester(params.purchaseId, student.id)
	return { purchase, isRequester }
}

export default ({ loaderData, actionData }: Route.ComponentProps) => {
	return (
		<>
			<Section>
				<SectionTitle>買い出し</SectionTitle>
				<SectionContent>
					<PurchaseCompletionSectionContent
						purchase={loaderData.purchase}
						isRequester={loaderData.isRequester}
						userType="student"
						shouldConfirm={Boolean(actionData?.shouldConfirm)}
					/>
				</SectionContent>
			</Section>
		</>
	)
}

export const action = async ({ request, params }: Route.ActionArgs) => {
	const { partId, student, session } = await entryStudentRoute(request, params.partId)

	const formData = await request.formData()

	const submission = parseWithZod(formData, { schema: formSchema })
	if (submission.status !== "success") {
		session.flash("error", { message: "入力に誤りがあります。" })
		return data(
			{ result: submission.reply(), shouldConfirm: false },
			{
				headers: { "Set-Cookie": await commitSession(session) },
			},
		)
	}
	if (submission.value.intent === "confirm") return { result: submission.reply(), shouldConfirm: true }

	const actualUsage = submission.value.actualUsage
	try {
		const purchase = await prisma.$transaction(async ($prisma) => {
			const { plannedUsage } = await $prisma.purchase.findUniqueOrThrow({
				where: { id: params.purchaseId },
				select: { plannedUsage: true },
			})
			const purchase = await $prisma.purchase.update({
				where: {
					id: params.purchaseId,
					part: { id: partId, students: { some: { id: student.id } } },
				},
				data: {
					balanced: plannedUsage === actualUsage,
					completion: {
						upsert: {
							update: {
								actualUsage,
							},
							create: {
								actualUsage,
							},
						},
					},
				},
				select: {
					label: true,
					requestedBy: {
						select: {
							id: true,
							name: true,
						},
					},
					completion: {
						select: {
							actualUsage: true,
						},
					},
					part: {
						select: {
							name: true,
							wallet: {
								select: {
									name: true,
								},
							},
						},
					},
				},
			})
			return purchase
		})

		const subscriptions = (
			await prisma.subscription.findMany({
				where: {
					OR: [
						{ student: { id: purchase.requestedBy.id } },
						{ student: { wallets: { some: { parts: { some: { id: partId } } } } } },
						{ teacher: { wallets: { some: { parts: { some: { id: partId } } } } } },
					],
				},
				select: {
					endpoint: true,
					auth: true,
					p256dh: true,
				},
			})
		).map((sub) => ({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }))
		sendPushNotification(subscriptions, {
			title: `使用額の報告 - ${formatCurrency(purchase.completion?.actualUsage || Number.NaN)}`,
			body: `（${purchase.part.wallet.name}）${purchase.part.name} ${purchase.requestedBy.name} ${purchase.label}`,
		})
		const successRedirect = buildSuccessRedirect(`/app/student/part/${partId}/purchase/${params.purchaseId}`, session)

		return await successRedirect(`買い出しの完了を報告しました：${purchase.label}`)
	} catch (error) {
		// biome-ignore lint/suspicious/noConsole: エラーをログに出力
		console.error(error)
		session.flash("error", { message: "購入の更新に失敗しました。" })
		return data(
			{ result: submission.reply(), shouldConfirm: false },
			{
				headers: { "Set-Cookie": await commitSession(session) },
			},
		)
	}
}
