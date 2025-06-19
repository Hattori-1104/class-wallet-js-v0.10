import { BellRing, Home, LogOut, Menu, ScrollText, Wallet } from "lucide-react"
import { useEffect } from "react"
import { Link, type LinkProps, Outlet, useMatches, useSubmit } from "react-router"
import { LayoutRelative, MainContainer } from "~/components/common/container"
import { Header, HeaderButton, HeaderUserInfo } from "~/components/common/header"
import { NavBar, NavBarItem } from "~/components/common/navbar"
import { NoData } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	useSidebar,
} from "~/components/ui/sidebar"
import { usePushNotification } from "~/hooks/use-push-notification"
import { cn } from "~/lib/utils"
import { entryStudentRoute } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import type { Route } from "./+types/layout-main"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { student, partId } = await entryStudentRoute(request, params.partId, false)
	const isAdmin =
		(await prisma.student.findUnique({
			where: {
				id: student.id,
				admin: true,
			},
		})) !== null

	const belongParts = await prisma.part.findMany({
		where: { students: { some: { id: student.id } } },
		select: {
			id: true,
			name: true,
			wallet: {
				select: {
					name: true,
				},
			},
		},
		orderBy: {
			wallet: {
				id: "asc",
			},
		},
	})

	const accountantWallets = await prisma.wallet.findMany({
		where: {
			accountantStudents: { some: { id: student.id } },
		},
		select: {
			id: true,
			name: true,
		},
		orderBy: {
			id: "asc",
		},
	})

	const vapidPublicKey = process.env.VAPID_PUBLIC_KEY

	return {
		student,
		belongParts,
		partId,
		isAdmin,
		accountantWallets,
		vapidPublicKey,
	}
}

export default ({
	loaderData: { student, belongParts, partId, isAdmin, accountantWallets, vapidPublicKey },
}: Route.ComponentProps) => {
	const matches = useMatches()
	const submit = useSubmit()
	const { isSupported, permission, requestPermissionAndSubscribe } = usePushNotification("student", vapidPublicKey)

	// コンポーネントマウント時に通知許可を求める
	useEffect(() => {
		if (isSupported && permission === "default") {
			requestPermissionAndSubscribe()
		}
	}, [isSupported, permission, requestPermissionAndSubscribe])

	return (
		<>
			<SidebarProvider>
				<Sidebar>
					<SidebarHeader>
						<Button variant="ghost" className="justify-start" onClick={requestPermissionAndSubscribe}>
							<BellRing />
							<span>
								{isSupported
									? {
											default: "通知を有効にする",
											denied: "通知が拒否されました。",
											granted: "通知を許可しています。",
										}[permission ?? "default"]
									: "通知をサポートしていません。"}
							</span>
						</Button>
					</SidebarHeader>
					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupLabel>
								<span>所属パート</span>
							</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{belongParts.length > 0 ? (
										belongParts.map((part) => (
											<SidebarMenuItem key={part.id}>
												<SidebarMenuButton asChild>
													<CloseSidebarLink
														to={`/app/student/part/${part.id}`}
														className={cn(partId === part.id && "font-bold")}
													>
														<span className="text-muted-foreground">（{part.wallet.name}）</span>
														<span>{part.name}</span>
													</CloseSidebarLink>
												</SidebarMenuButton>
											</SidebarMenuItem>
										))
									) : (
										<NoData className="py-2">所属パートがありません</NoData>
									)}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>

						{accountantWallets.length > 0 && (
							<SidebarGroup>
								<SidebarGroupLabel>HR会計担当ウォレット</SidebarGroupLabel>
								<SidebarGroupContent>
									<SidebarMenu>
										{accountantWallets.map((wallet) => (
											<SidebarMenuItem key={wallet.id}>
												<SidebarMenuButton asChild>
													<Link to={`/app/student/accountant/${wallet.id}`}>{wallet.name}</Link>
												</SidebarMenuButton>
											</SidebarMenuItem>
										))}
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						)}
						{isAdmin && (
							<SidebarGroup>
								<SidebarGroupLabel>管理者</SidebarGroupLabel>
								<SidebarGroupContent>
									<SidebarMenu>
										<SidebarMenuItem>
											<SidebarMenuButton asChild>
												<Link to="/app/admin">管理者ページ</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
										<SidebarMenuItem>
											<SidebarMenuButton asChild>
												<Link to="/app/admin/check-cash">出納簿点検</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
										<SidebarMenuItem>
											<SidebarMenuButton asChild>
												<Link to="/app/admin/cash-book">全体出納簿</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						)}
					</SidebarContent>
					<SidebarFooter>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									variant="destructive"
									onClick={() => submit(null, { method: "post", action: "/app/auth/logout" })}
								>
									<LogOut />
									ログアウト
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarFooter>
				</Sidebar>
				<LayoutRelative>
					<Header>
						<SidebarTrigger />
						<HeaderUserInfo {...student} />
					</Header>
					<MainContainer>
						<Outlet />
					</MainContainer>
					<NavBar>
						<NavBarItem
							Icon={ScrollText}
							label="出納簿"
							to={`/app/student/part/${partId}/cash-book`}
							isActive={matches.some((match) => match.id === "routes/app/student/cash-book")}
						/>

						<NavBarItem
							Icon={Home}
							label="ホーム"
							to={`/app/student/part/${partId}`}
							isActive={matches.some((match) => match.id === "routes/app/student/part")}
						/>
						<NavBarItem
							Icon={Wallet}
							label="ウォレット"
							to={`/app/student/part/${partId}/wallet`}
							isActive={matches.some((match) => match.id === "routes/app/student/wallet")}
						/>
					</NavBar>
				</LayoutRelative>
			</SidebarProvider>
		</>
	)
}

function SidebarTrigger() {
	const { toggleSidebar } = useSidebar()
	return (
		<HeaderButton onClick={toggleSidebar}>
			<Menu />
		</HeaderButton>
	)
}

function CloseSidebarLink({ children, ...props }: LinkProps) {
	// biome-ignore lint/correctness/noUnusedVariables: サイドバーを閉じるために使用
	const { setOpen, setOpenMobile, isMobile } = useSidebar()

	const handleClick = () => {
		if (isMobile) {
			setOpenMobile(false)
		} else {
			// setOpen(false)
		}
	}

	return (
		<Link {...props} onClick={handleClick}>
			{children}
		</Link>
	)
}
