import { ChevronLeft, LogOutIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Link, useNavigation } from "react-router"
import { useNavigate } from "react-router"
import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"

export const Header = ({ children }: { children: ReactNode }) => {
	const navigation = useNavigation()
	const isNavigating = Boolean(navigation.location)

	return (
		<header className="h-16 border-b shrink-0 relative">
			<div className="container mx-auto px-8 h-full flex flex-row items-center justify-between">{children}</div>
			<div className={cn("absolute w-full h-1 bg-[#3992ff] transition-opacity opacity-0 delay-75", isNavigating && "opacity-50")} />
		</header>
	)
}

export const HeaderButton = ({ children, asChild = false, onClick }: { children: ReactNode; asChild?: boolean; onClick?: () => void }) => {
	return (
		<Button variant={"ghost"} className="size-12" asChild={asChild} onClick={onClick}>
			{children}
		</Button>
	)
}

export const HeaderLogOutButton = () => {
	return (
		<HeaderButton asChild>
			<Link to="/auth/logout">
				<LogOutIcon size={24} />
			</Link>
		</HeaderButton>
	)
}

export const HeaderBackButton = ({ to }: { to?: string }) => {
	const navigate = useNavigate()
	if (!to)
		return (
			<HeaderButton onClick={() => navigate(-1)}>
				<ChevronLeft />
			</HeaderButton>
		)
	return (
		<HeaderButton asChild>
			<Link to={to}>
				<ChevronLeft />
			</Link>
		</HeaderButton>
	)
}
export const HeaderUserInfo = ({ name, email }: { name: string; email: string }) => {
	return (
		<div className="flex flex-col text-right gap-1">
			<span className="text-sm leading-none">{name}</span>
			<span className="text-xs leading-none text-muted-foreground">{email}</span>
		</div>
	)
}
