import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes"

export default [
	layout("routes/app-layout.tsx", [
		index("routes/home.tsx"),
		route("/auth/:action?", "routes/auth.tsx"),
		...prefix("/app", [
			...prefix("/student", [
				layout("routes/app/student/layout.tsx", [index("routes/app/student/dashboard.tsx")]),
				...prefix("part/:partId", [
					layout("routes/app/student/part/layout.tsx", [
						index("routes/app/student/part/dashboard/index.tsx"),
						route("member", "routes/app/student/part/member.tsx"),
						route("purchase", "routes/app/student/part/purchase/index.tsx"),
					]),
					route("purchase", "routes/app/student/part/purchase/layout.tsx", [
						route("new", "routes/app/student/part/purchase/new/index.tsx"),
						route(":purchaseId", "routes/app/student/part/purchase/detail/index.tsx"),
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
				]),
			]),
		]),
	]),
] satisfies RouteConfig
