import type { ReactNode } from "react"
import { useNavigation } from "react-router"
import { cn } from "~/lib/utils"

export const Header = ({ children }: { children: ReactNode }) => {
	const navigation = useNavigation()
	const isNavigating = Boolean(navigation.location)

	return (
		<header className="h-16 border-b shrink-0 relative">
			<div className="container mx-auto px-8 h-full flex flex-row items-center justify-between">{children}</div>
			<div
				className={cn(
					"absolute w-full h-1 bg-[#3992ff] transition-opacity opacity-0 delay-75",
					isNavigating && "opacity-50",
				)}
			/>
		</header>
	)
}
