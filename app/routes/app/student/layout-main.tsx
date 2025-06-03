import { Home, LogOut, Menu, ScrollText, Wallet } from "lucide-react"
import {
	Link,
	type LinkProps,
	Outlet,
	useMatches,
	useSubmit,
} from "react-router"
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
	SidebarFooter,
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
import { entryStudentRoute } from "~/route-modules/common.server"
import { prisma } from "~/services/repository.server"
import type { Route } from "./+types/layout-main"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const { student, partId } = await entryStudentRoute(
		request,
		params.partId,
		false,
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
	const submit = useSubmit()
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
							isActive={matches.some(
								(match) => match.id === "routes/app/student/cash-book",
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
