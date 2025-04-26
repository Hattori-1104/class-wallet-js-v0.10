import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes"

export default [
	layout("routes/app-layout.tsx", [
		index("routes/home.tsx"),
		route("/auth/:action?", "routes/auth.tsx"),
		...prefix("/app", [
			index("routes/app/index.tsx"),
			...prefix("/student", [
				layout("routes/app/student/layout.tsx", [index("routes/app/student/dashboard.tsx")]),
				...prefix("part/:partId", [
					layout("routes/app/student/part/layout.tsx", [
						index("routes/app/student/part/dashboard.tsx"),
						route("member", "routes/app/student/part/member.tsx"),
						route("purchase", "routes/app/student/part/purchase.tsx"),
					]),
					layout("routes/app/student/part/layout-push.tsx", [
						route("purchase/new", "routes/app/student/part/purchase-new.tsx"),
						route("purchase/:purchaseId", "routes/app/student/part/purchase-detail.tsx"),
					]),
				]),
				...prefix("/wallet/:walletId", [
					layout("routes/app/student/wallet/layout.tsx", [
						index("routes/app/student/wallet/dashboard.tsx"),
						route("create", "routes/app/student/wallet/create.tsx"),
					]),
				]),
			]),
			...prefix("/teacher", [
				layout("routes/app/teacher/layout.tsx", [index("routes/app/teacher/dashboard.tsx")]),
				...prefix("wallet/:walletId", [
					layout("routes/app/teacher/wallet/layout.tsx", [
						index("routes/app/teacher/wallet/dashboard/index.tsx"),
						route("member", "routes/app/teacher/wallet/member.tsx"),
						route("purchase", "routes/app/teacher/wallet/purchase/index.tsx"),
					]),
					route("purchase", "routes/app/teacher/wallet/purchase/layout.tsx", [route(":purchaseId", "routes/app/teacher/wallet/purchase/detail/index.tsx")]),
				]),
			]),
			...prefix("/admin", [
				layout("routes/app/admin/layout.tsx", [
					index("routes/app/admin/index.tsx"),
					route("wallet", "routes/app/admin/wallet.tsx"),
					route("wallet/create", "routes/app/admin/wallet-create.tsx"),
				]),
			]),
			...prefix("/invite", [
				route("wallet/:walletId", "routes/app/invite/wallet.tsx"),
				route("wallet/:walletId/accountant", "routes/app/invite/wallet-accountant.tsx"),
				route("wallet/:walletId/teacher", "routes/app/invite/wallet-teacher.tsx"),
				route("part/:partId", "routes/app/invite/part.tsx"),
			]),
		]),
	]),
	...prefix("/test", [route("icon", "routes/test/icon.tsx")]),
] satisfies RouteConfig
