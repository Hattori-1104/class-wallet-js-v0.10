import type { ReactNode } from "react"
import { Link, type LinkProps } from "react-router"
import { cn } from "~/lib/utils"
import type { Icon } from "~/utilities/type"

export const NavBar = ({ children }: { children: ReactNode }) => {
	return (
		<nav className="h-18 pb-2 border-t shrink-0 sticky bottom-0 bg-white">
			<div className="container mx-auto px-8 h-full flex flex-row items-center justify-between">
				{children}
			</div>
		</nav>
	)
}

export const NavBarItem = ({
	Icon,
	label,
	to,
	isActive,
	...props
}: LinkProps & { Icon: Icon; label: string; isActive: boolean }) => {
	return (
		<Link
			to={to}
			className={cn(
				"flex flex-col justify-center items-center gap-1 max-w-20 h-full w-full transition-all duration-200",
				"text-muted-foreground",
				isActive && "text-foreground font-bold",
			)}
			{...props}
		>
			<Icon size={24} />
			<span className="text-xs">{label}</span>
		</Link>
	)
}
