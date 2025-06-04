import { useSubmit } from "react-router"
import webpush from "web-push"
import { Button } from "~/components/ui/button"
import { verifyStudent } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import { requireSession } from "~/services/session.server"
import type { Route } from "./+types/push-test"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	await verifyStudent(session)
	return null
}

export default () => {
	const submit = useSubmit()
	return (
		<Button onClick={() => submit(null, { method: "post" })}>push-test</Button>
	)
}

export const action = async ({ request }: Route.ActionArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)
	const subscriptions = await prisma.subscription.findMany({
		where: { studentId: student.id },
	})
	const vapidKeys = {
		publicKey: process.env.VAPID_PUBLIC_KEY || "",
		privateKey: process.env.VAPID_PRIVATE_KEY || "",
	}

	webpush.setVapidDetails(
		"mailto:hattori.index.js@gmail.com",
		vapidKeys.publicKey,
		vapidKeys.privateKey,
	)
	for (const subscription of subscriptions) {
		const pushSubscription = {
			endpoint: subscription.endpoint,
			keys: {
				auth: subscription.auth,
				p256dh: subscription.p256dh,
			},
		}
		const payload = {
			body: "test",
			others: "other",
		}
		webpush
			.sendNotification(pushSubscription, JSON.stringify(payload))
			.catch((err) => {
				console.error(err)
			})
	}
	return null
}
