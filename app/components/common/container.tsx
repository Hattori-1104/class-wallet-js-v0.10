import { Slot } from "@radix-ui/react-slot"
import type { ReactNode } from "react"
import { cn } from "~/lib/utils"

export const MainContainer = ({ children, className }: { children: ReactNode; className?: string }) => {
	return <div className={cn("grow container mx-auto px-8 overflow-y-scroll scrollbar-hidden", className)}>{children}</div>
}

export const LimitedContainer = ({ children }: { children: ReactNode }) => {
	return (
		<div className="grow flex items-center justify-center">
			<div className="container min-[64rem]:max-w-5xl px-8 desk:border desk:rounded-2xl desk:shadow-md">
				<div className="my-8">{children}</div>
			</div>
		</div>
	)
}

export const Section = ({ children, className }: { children: ReactNode; className?: string }) => {
	return <section className={cn("my-8 w-full", className)}>{children}</section>
}
export const SectionTitle = ({ children, className }: { children: ReactNode; className?: string }) => {
	return <div className={cn("my-8", className)}>{children}</div>
}
export const SectionContent = ({
	children,
	className,
	asChild,
	...props
}: { children: ReactNode; className?: string; asChild?: boolean } & React.ComponentProps<typeof Slot>) => {
	if (asChild) {
		return (
			<Slot className={cn("my-6", className)} {...props}>
				{children}
			</Slot>
		)
	}
	return <div className={cn("my-6", className)}>{children}</div>
}

export function HorizonContainer({ className, children }: { className?: string; children: ReactNode }) {
	return <div className={cn("contents w-full sm:flex sm:flex-row sm:gap-8 sm:my-[-2rem]", className)}>{children}</div>
}
