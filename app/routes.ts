import {
	type RouteConfig,
	index,
	layout,
	prefix,
	route,
} from "@react-router/dev/routes"

export default [
	route("/app", "routes/app/layout-root.tsx", [
		// 生徒
		...prefix("student", [
			...prefix("part/:partId?", [
				layout("routes/app/student/layout-main.tsx", [
					index("routes/app/student/part.tsx"),
					route("wallet", "routes/app/student/wallet.tsx"),
					route("cash-book", "routes/app/student/cash-book.tsx"),
				]),
				layout("routes/app/student/layout-push.tsx", [
					route("purchase/new", "routes/app/student/purchase/new.tsx"),
				]),
				...prefix("purchase/:purchaseId", [
					layout("routes/app/student/purchase/layout.tsx", [
						index("routes/app/student/purchase/router.tsx"),
						route("approval", "routes/app/student/purchase/approval.tsx"),
						route("completion", "routes/app/student/purchase/completion.tsx"),
						route(
							"receiptSubmission",
							"routes/app/student/purchase/receipt-submission.tsx",
						),
					]),
				]),
				route("invite", "routes/app/student/invite.tsx"),
			]),
			route("push-subscription", "routes/app/student/push-subscription.tsx"),
			route("accountant/:walletId", "routes/app/student/accountant.tsx"),
			route(
				"accountant/:walletId/invite",
				"routes/app/student/accountantInvite.tsx",
			),

			route("push-test", "routes/app/student/push-test.tsx"),
			// 振り分け
			route("*", "routes/app/student/router.tsx", { index: true }),
		]),
		// 教師
		...prefix("teacher", [
			...prefix("wallet/:walletId?", [
				layout("routes/app/teacher/layout-main.tsx", [
					index("routes/app/teacher/wallet.tsx"),
					route("cash-book", "routes/app/teacher/cash-book.tsx"),
				]),
				...prefix("purchase/:purchaseId", [
					layout("routes/app/teacher/purchase/layout.tsx", [
						index("routes/app/teacher/purchase/router.tsx"),
						route("approval", "routes/app/teacher/purchase/approval.tsx"),
						route("completion", "routes/app/teacher/purchase/completion.tsx"),
						route(
							"receiptSubmission",
							"routes/app/teacher/purchase/receipt-submission.tsx",
						),
					]),
				]),
			]),

			route("*", "routes/app/teacher/router.tsx", { index: true }),
		]),
		// 生徒会(管理者)
		...prefix("admin", [
			layout("routes/app/admin/layout.tsx", [
				index("routes/app/admin/index.tsx"),
			]),
		]),
		// 認証
		...prefix("auth", [
			index("routes/app/auth/index.tsx"),
			route("dev", "routes/app/auth/dev-login.tsx"),
			route("logout", "routes/app/auth/logout.tsx"),
			route("oauth", "routes/app/auth/oauth.entry.tsx"),
			route("oauth/callback", "routes/app/auth/oauth.callback.tsx"),
		]),
		// 振り分け
		route("*", "routes/app/router.tsx", { index: true }),
	]),
	route("test", "routes/test.tsx", { index: true }),
	// 振り分け
	route("*?", "routes/router.tsx", { index: true }),
] satisfies RouteConfig
