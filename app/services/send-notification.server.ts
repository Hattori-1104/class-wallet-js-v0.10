import webPush, { type PushSubscription } from "web-push"
import { prisma } from "./repository.server"

export type PushNotificationMessage = {
	title: string // 通知のタイトル
	body: string // 通知の本文
	url?: string // 通知をクリックしたときに開く URL
}

export const sendPushNotification = async (
	subscriptions: PushSubscription[],
	message: PushNotificationMessage,
): Promise<void> => {
	if (subscriptions.length === 0) {
		return
	}
	webPush.setVapidDetails(
		"mailto:hattori.index.js", // プッシュサービスが送信者と通信する必要がある場合にそれを可能にする情報
		process.env.VAPID_PUBLIC_KEY ?? "", // VAPID 公開鍵
		process.env.VAPID_PRIVATE_KEY ?? "", // VAPID 秘密鍵
	)

	subscriptions.map((sub) =>
		webPush
			.sendNotification(sub, JSON.stringify(message))
			.catch(() => prisma.subscription.delete({ where: { endpoint: sub.endpoint } })),
	)
}
