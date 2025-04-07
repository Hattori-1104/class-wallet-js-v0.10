import type { ReactNode } from "react"

export const NavBar = ({ children }: { children: ReactNode }) => {
	return (
		<nav className="h-16 border-t shrink-0">
			<div className="container mx-auto px-8 h-full flex flex-row items-center justify-between">{children}</div>
		</nav>
	)
}
