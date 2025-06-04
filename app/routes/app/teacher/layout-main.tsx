import { Home, LogOut, ScrollText } from "lucide-react"
import { Menu } from "lucide-react"
import { Outlet, useMatches, useSubmit } from "react-router"
import type { LinkProps } from "react-router"
import { Link } from "react-router"
import { MainContainer } from "~/components/common/container"
import { LayoutRelative } from "~/components/common/container"
import {
	Header,
	HeaderButton,
	HeaderUserInfo,
} from "~/components/common/header"
import { NavBarItem } from "~/components/common/navbar"
import { NavBar } from "~/components/common/navbar"
import { NoData } from "~/components/common/typography"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from "~/components/ui/sidebar"
import { useSidebar } from "~/components/ui/sidebar"
import { cn } from "~/lib/utils"
import { entryTeacherRoute } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import type { Route } from "./+types/layout-main"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { teacher, walletId } = await entryTeacherRoute(
		request,
		params.walletId,
		false,
	)

	const belongWallets = await prisma.wallet.findMany({
		where: { teachers: { some: { id: teacher.id } } },
	})

	return { teacher, belongWallets, walletId }
}

export default ({
	loaderData: { teacher, belongWallets, walletId },
}: Route.ComponentProps) => {
	const matches = useMatches()
	const submit = useSubmit()
	return (
		<>
			<SidebarProvider>
				<Sidebar>
					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupLabel>所属ウォレット</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{belongWallets.length > 0 ? (
										belongWallets.map((wallet) => (
											<SidebarMenuItem key={wallet.id}>
												<SidebarMenuButton asChild>
													<CloseSidebarLink
														to={`/app/teacher/wallet/${wallet.id}`}
														className={cn(
															walletId === wallet.id && "font-bold",
														)}
													>
														{wallet.name}
													</CloseSidebarLink>
												</SidebarMenuButton>
											</SidebarMenuItem>
										))
									) : (
										<NoData className="py-2">所属ウォレットがありません</NoData>
									)}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>
					<SidebarFooter>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									variant="destructive"
									onClick={() =>
										submit(null, { method: "post", action: "/app/auth/logout" })
									}
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
						<HeaderUserInfo {...teacher} />
					</Header>
					<MainContainer>
						<Outlet />
					</MainContainer>
					<NavBar>
						<NavBarItem
							Icon={ScrollText}
							label="出納簿"
							to={`/app/teacher/wallet/${walletId}/cash-book`}
							isActive={matches.some(
								(match) => match.id === "routes/app/teacher/cash-book",
							)}
						/>

						<NavBarItem
							Icon={Home}
							label="ホーム"
							to={`/app/teacher/wallet/${walletId}`}
							isActive={matches.some(
								(match) => match.id === "routes/app/teacher/wallet",
							)}
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
