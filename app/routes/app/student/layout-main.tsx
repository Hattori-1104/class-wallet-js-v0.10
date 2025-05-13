import { Home, Menu, Settings, Wallet } from "lucide-react"
import { Link, type LinkProps, Outlet, useMatches } from "react-router"
import { LayoutRelative, MainContainer } from "~/components/common/container"
import {
	Header,
	HeaderButton,
	HeaderUserInfo,
} from "~/components/common/header"
import { NavBar, NavBarItem } from "~/components/common/navbar"
import { NoData } from "~/components/common/typography"
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	useSidebar,
} from "~/components/ui/sidebar"
import { cn } from "~/lib/utils"
import { prisma } from "~/services/repository.server"
import { entryPartRoute } from "~/services/route-module.server"
import type { Route } from "./+types/layout-main"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { student, session, partId } = await entryPartRoute(
		request,
		params.partId,
	)

	const belongParts = await prisma.part.findMany({
		where: { students: { some: { id: student.id } } },
	})

	return { student, belongParts, partId }
}

export default ({
	loaderData: { student, belongParts, partId },
}: Route.ComponentProps) => {
	const matches = useMatches()
	return (
		<>
			<SidebarProvider>
				<Sidebar>
					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupLabel>所属パート</SidebarGroupLabel>
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
														{part.name}
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
					</SidebarContent>
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
							Icon={Settings}
							label="設定"
							to={`/app/student/part/${partId}/settings`}
							isActive={matches.some(
								(match) => match.id === "routes/app/student/settings",
							)}
						/>

						<NavBarItem
							Icon={Home}
							label="ホーム"
							to={`/app/student/part/${partId}`}
							isActive={matches.some(
								(match) => match.id === "routes/app/student/part",
							)}
						/>
						<NavBarItem
							Icon={Wallet}
							label="ウォレット"
							to={`/app/student/part/${partId}/wallet`}
							isActive={matches.some(
								(match) => match.id === "routes/app/student/wallet",
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
