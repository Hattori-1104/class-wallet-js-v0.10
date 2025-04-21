import type { ReactNode } from "react"

export const NavBar = ({ children }: { children: ReactNode }) => {
	return (
		<nav className="h-16 border-t shrink-0">
			<div className="container mx-auto px-8 h-full flex flex-row items-center justify-between">{children}</div>
		</nav>
	)
}

export const navBarItemClassName = {
	item: "flex flex-col justify-center items-center gap-2 py-1 max-w-32 h-full w-full",
	label: "text-xs font-normal",
}
