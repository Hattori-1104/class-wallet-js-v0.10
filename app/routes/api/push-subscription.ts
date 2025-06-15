import { z } from "zod"
import { prisma } from "~/services/repository.server"
import { requireSession } from "~/services/session.server"
import type { Route } from "./+types/push-subscription"

export const subscriptionBodySchema = z.object({
	type: z.enum(["student", "teacher"]),
	subscription: z.object({
		endpoint: z.string(),
		keys: z.object({
			p256dh: z.string(),
			auth: z.string(),
		}),
	}),
})

export type SubscriptionBodyType = z.infer<typeof subscriptionBodySchema>

export const action = async ({ request }: Route.ActionArgs) => {
	const session = await requireSession(request)
	const user = session.get("user")
	if (!user) return "failed"
	try {
		const body = subscriptionBodySchema.parse(await request.json())
		if (body.type !== user.type) return "failed"
		if (body.type === "student") {
			const student = user
			await prisma.subscription.create({
				data: {
					endpoint: body.subscription.endpoint,
					p256dh: body.subscription.keys.p256dh,
					auth: body.subscription.keys.auth,
					student: {
						connect: {
							id: student.id,
						},
					},
				},
			})
			return "success"
		}
		if (body.type === "teacher") {
			const teacher = user
			await prisma.subscription.create({
				data: {
					endpoint: body.subscription.endpoint,
					p256dh: body.subscription.keys.p256dh,
					auth: body.subscription.keys.auth,
					teacher: {
						connect: {
							id: teacher.id,
						},
					},
				},
			})
			return "success"
		}
	} catch (_) {
		return "failed"
	}
}
