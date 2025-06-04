import { z } from "zod"
import { verifyStudent } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import { requireSession } from "~/services/session.server"
import type { Route } from "./+types/push-subscription"

// Push Subscription のzodスキーマ定義
const subscriptionSchema = z.object({
	endpoint: z.string().url().min(1, "エンドポイントは必須です"),
	keys: z.object({
		p256dh: z.string().min(1, "p256dhキーは必須です"),
		auth: z.string().min(1, "authキーは必須です"),
	}),
})

// 型定義をエクスポート
export type SubscriptionRequest = z.infer<typeof subscriptionSchema>

export const action = async ({ request }: Route.ActionArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)

	try {
		const body = await request.json()

		// zodでバリデーション
		const result = subscriptionSchema.safeParse(body)

		if (!result.success) {
			return Response.json(
				{ error: "不正なリクエストデータです", issues: result.error },
				{ status: 400 },
			)
		}

		const { endpoint, keys } = result.data

		await prisma.subscription.upsert({
			where: { endpoint },
			update: {
				p256dh: keys.p256dh,
				auth: keys.auth,
				studentId: student.id,
				updatedAt: new Date(),
			},
			create: {
				endpoint,
				p256dh: keys.p256dh,
				auth: keys.auth,
				studentId: student.id,
			},
		})

		return Response.json({ success: true })
	} catch (error) {
		console.error("Push subscription error:", error)
		return Response.json(
			{ error: "内部サーバーエラーが発生しました" },
			{ status: 500 },
		)
	}
}
