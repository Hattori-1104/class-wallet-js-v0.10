import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes"

export default [
	layout("routes/app-layout.tsx", [
		index("routes/home.tsx"),
		route("/auth/:action?", "routes/auth.tsx"),
		...prefix("/app", [
			...prefix("/student", [
				index("routes/app/student/dashboard.tsx"),
				...prefix("part/:partId", [
					layout("routes/app/student/part/layout.tsx", [
						index("routes/app/student/part/index.tsx"),
						route("member", "routes/app/student/part/member.tsx"),
						route("purchase", "routes/app/student/part/purchase/summary.tsx"),
					]),
					route("purchase", "routes/app/student/part/purchase/layout.tsx", [
						route("new", "routes/app/student/part/purchase/new/index.tsx"),
						route(":purchaseId", "routes/app/student/part/purchase/detail.tsx"),
					]),
				]),
			]),
		]),
	]),
] satisfies RouteConfig
