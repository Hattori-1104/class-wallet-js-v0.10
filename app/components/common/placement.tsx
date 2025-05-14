import type { ReactNode } from "react"
import { cn } from "~/lib/utils"

const gapClass = {
	none: "gap-0",
	xs: "gap-1",
	sm: "gap-2",
	md: "gap-4",
	lg: "gap-6",
	xl: "gap-8",
}

type GapSize = keyof typeof gapClass

export const Aside = ({
	children,
	className,
	gap = "md",
}: { children: ReactNode; className?: string; gap?: GapSize }) => {
	return (
		<div className={cn("flex flex-row items-center", gapClass[gap], className)}>
			{children}
		</div>
	)
}

export const AsideEven = ({
	children,
	className,
	gap = "md",
}: { children: ReactNode; className?: string; gap?: GapSize }) => {
	return (
		<div className={cn("grid grid-cols-2", gapClass[gap], className)}>
			{children}
		</div>
	)
}

export const Distant = ({
	children,
	className,
}: { children: ReactNode; className?: string }) => {
	return (
		<div
			className={cn(
				"w-full flex flex-row gap-2 items-center justify-between",
				className,
			)}
		>
			{children}
		</div>
	)
}
