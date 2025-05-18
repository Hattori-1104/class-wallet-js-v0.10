import type { ReactNode } from "react"
import { cn } from "~/lib/utils"
export const Title = ({
	children,
	className,
}: { children: ReactNode; className?: string }) => {
	return (
		<h1 className={cn("text-foreground font-bold text-lg", className)}>
			{children}
		</h1>
	)
}

export const NoData = ({
	children,
	className,
}: { children: ReactNode; className?: string }) => {
	return (
		<span
			className={cn(
				"text-muted-foreground font-normal text-md italic",
				className,
			)}
		>
			{children}
		</span>
	)
}
