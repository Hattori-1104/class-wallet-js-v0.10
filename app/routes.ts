import {
	type RouteConfig,
	index,
	layout,
	prefix,
	route,
} from "@react-router/dev/routes"

// export default [
// 	layout("routes/app-layout.tsx", [
// 		index("routes/home.tsx"),
// 		route("/auth/:action?", "routes/auth.tsx"),
// 		...prefix("/auth/oauth", [index("routes/oauth/index.tsx"), route("callback", "routes/oauth/callback.tsx")]),
// 		...prefix("/app", [
// 			index("routes/app/index.tsx"),
// 			...prefix("/student", [
// 				layout("routes/app/student/layout.tsx", [index("routes/app/student/dashboard.tsx")]),
// 				...prefix("part/:partId", [
// 					layout("routes/app/student/part/layout.tsx", [
// 						index("routes/app/student/part/dashboard.tsx"),
// 						route("member", "routes/app/student/part/member.tsx"),
// 						route("purchase", "routes/app/student/part/purchase-summary.tsx"),
// 					]),
// 					layout("routes/app/student/part/layout-push.tsx", [
// 						route("purchase/new", "routes/app/student/part/purchase-new.tsx"),
// 						route("purchase/:purchaseId", "routes/app/student/part/purchase-detail.tsx"),
// 					]),
// 					layout("routes/app/student/part/purchase-state/layout.tsx", [
// 						...prefix("purchase/:purchaseId", [
// 							route("request", "routes/app/student/part/purchase-state/request.tsx"),
// 							route("accountantApproval", "routes/app/student/part/purchase-state/accountant-approval.tsx"),
// 							route("teacherApproval", "routes/app/student/part/purchase-state/teacher-approval.tsx"),
// 							route("givenMoney", "routes/app/student/part/purchase-state/given-money.tsx"),
// 							route("usageReport", "routes/app/student/part/purchase-state/usage-report.tsx"),
// 							route("changeReturn", "routes/app/student/part/purchase-state/change-return.tsx"),
// 							route("receiptSubmission", "routes/app/student/part/purchase-state/receipt-submission.tsx"),
// 						]),
// 					]),
// 				]),
// 				...prefix("/wallet/:walletId", [
// 					layout("routes/app/student/wallet/layout.tsx", [index("routes/app/student/wallet/dashboard.tsx")]),
// 					layout("routes/app/student/wallet/layout-push.tsx", [
// 						route("create", "routes/app/student/wallet/part-create.tsx"),
// 						route("create-bazaar", "routes/app/student/wallet/bazaar-create.tsx"),
// 					]),
// 				]),
// 			]),
// 			...prefix("/teacher", [
// 				layout("routes/app/teacher/layout.tsx", [index("routes/app/teacher/dashboard.tsx")]),
// 				...prefix("wallet/:walletId", [
// 					layout("routes/app/teacher/wallet/layout.tsx", [
// 						index("routes/app/teacher/wallet/dashboard.tsx"),
// 						route("member", "routes/app/teacher/wallet/member.tsx"),
// 						route("purchase", "routes/app/teacher/wallet/purchase-summary.tsx"),
// 					]),
// 					layout("routes/app/teacher/wallet/layout-push.tsx", [
// 						route("purchase/:purchaseId", "routes/app/teacher/wallet/purchase-detail.tsx"),
// 					]),
// 					layout("routes/app/teacher/wallet/purchase-state/layout.tsx", [
// 						...prefix("purchase/:purchaseId", [
// 							route("request", "routes/app/teacher/wallet/purchase-state/request.tsx"),
// 							route("accountantApproval", "routes/app/teacher/wallet/purchase-state/accountant-approval.tsx"),
// 							route("teacherApproval", "routes/app/teacher/wallet/purchase-state/teacher-approval.tsx"),
// 							route("givenMoney", "routes/app/teacher/wallet/purchase-state/given-money.tsx"),
// 							route("usageReport", "routes/app/teacher/wallet/purchase-state/usage-report.tsx"),
// 							route("changeReturn", "routes/app/teacher/wallet/purchase-state/change-return.tsx"),
// 							route("receiptSubmission", "routes/app/teacher/wallet/purchase-state/receipt-submission.tsx"),
// 						]),
// 					]),
// 				]),
// 			]),
// 			...prefix("/admin", [
// 				layout("routes/app/admin/layout.tsx", [
// 					index("routes/app/admin/index.tsx"),
// 					route("wallet", "routes/app/admin/wallet.tsx"),
// 				]),
// 				layout("routes/app/admin/layout-push.tsx", [route("wallet/create", "routes/app/admin/wallet-create.tsx")]),
// 			]),
// 			...prefix("/invite", [
// 				route("wallet/:walletId", "routes/app/invite/wallet.tsx"),
// 				route("wallet/:walletId/accountant", "routes/app/invite/wallet-accountant.tsx"),
// 				route("wallet/:walletId/teacher", "routes/app/invite/wallet-teacher.tsx"),
// 				route("part/:partId", "routes/app/invite/part.tsx"),
// 			]),
// 		]),
// 	]),
// 	...prefix("/test", [route("icon", "routes/test/icon.tsx")]),
// ] satisfies RouteConfig

export default [
	route("/app", "routes/app/layout-root.tsx", [
		// 生徒
		...prefix("student", [
			...prefix("part/:partId?", [
				layout("routes/app/student/layout-main.tsx", [
					index("routes/app/student/part.tsx"),
					route("wallet", "routes/app/student/wallet.tsx"),
					route("settings", "routes/app/student/settings.tsx"),
				]),
				layout("routes/app/student/layout-push.tsx", [
					route("purchase/new", "routes/app/student/new-request.tsx"),
				]),
			]),
			// 振り分け
			route("*", "routes/app/student/router.tsx", { index: true }),
		]),
		// 認証
		...prefix("auth", [
			index("routes/app/auth/index.tsx"),
			route("oauth", "routes/app/auth/oauth.entry.tsx"),
			route("oauth/callback", "routes/app/auth/oauth.callback.tsx"),
		]),
		// 振り分け
		route("*", "routes/app/router.tsx", { index: true }),
	]),
	route("test", "routes/test.tsx", { index: true }),
] satisfies RouteConfig
