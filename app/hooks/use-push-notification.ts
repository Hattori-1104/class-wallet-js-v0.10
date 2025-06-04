import { useCallback, useEffect, useState } from "react"
import { useFetcher } from "react-router"

interface PushNotificationState {
	permission: NotificationPermission | null
	isSupported: boolean
	isLoading: boolean
	error: string | null
}

export function usePushNotification(vapidPublicKey?: string) {
	const fetcher = useFetcher()
	const [state, setState] = useState<PushNotificationState>({
		permission: null,
		isSupported: false,
		isLoading: false,
		error: null,
	})

	// ブラウザサポート確認
	useEffect(() => {
		const isSupported =
			"Notification" in window &&
			"serviceWorker" in navigator &&
			"PushManager" in window

		setState((prev) => ({
			...prev,
			isSupported,
			permission: isSupported ? Notification.permission : null,
		}))
	}, [])

	const requestPermissionAndSubscribe = useCallback(async () => {
		if (!state.isSupported) return

		setState((prev) => ({ ...prev, isLoading: true, error: null }))

		try {
			// 通知許可を要求
			const permission = await Notification.requestPermission()
			setState((prev) => ({ ...prev, permission }))

			if (permission !== "granted") {
				setState((prev) => ({
					...prev,
					isLoading: false,
					error: "通知の許可が必要です",
				}))
				return
			}

			// Service Worker を取得
			const registration = await navigator.serviceWorker.ready

			// プッシュ通知を購読（VAPID公開鍵は環境変数から取得）
			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: vapidPublicKey,
			})

			// 購読データをサーバーに送信
			const subscriptionData = {
				endpoint: subscription.endpoint,
				keys: {
					p256dh: btoa(
						String.fromCharCode(
							...new Uint8Array(subscription.getKey("p256dh") || []),
						),
					),
					auth: btoa(
						String.fromCharCode(
							...new Uint8Array(subscription.getKey("auth") || []),
						),
					),
				},
			}

			fetcher.submit(subscriptionData, {
				method: "post",
				action: "/app/student/push-subscription",
				encType: "application/json",
			})

			setState((prev) => ({ ...prev, isLoading: false }))
		} catch (error) {
			console.error("Push notification setup error:", error)
			setState((prev) => ({
				...prev,
				isLoading: false,
				error: "プッシュ通知の設定に失敗しました",
			}))
		}
	}, [state.isSupported, fetcher, vapidPublicKey])

	return {
		...state,
		requestPermissionAndSubscribe,
	}
}
