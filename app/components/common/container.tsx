import type { ReactNode } from "react"
import { cn } from "~/lib/utils"

export const MainContainer = ({ children }: { children: ReactNode }) => {
	return <div className="grow container mx-auto px-8">{children}</div>
}

export const CenterCardContainer = ({ children }: { children: ReactNode }) => {
	return (
		<div className="grow flex items-center justify-center">
			<div className="container min-[64rem]:max-w-5xl px-8 desk:border desk:rounded-2xl desk:shadow-md">
				<div className="my-8">{children}</div>
			</div>
		</div>
	)
}

export const Section = ({ children }: { children: ReactNode }) => {
	return <section className="my-8">{children}</section>
}
export const SectionTitle = ({ children, className }: { children: ReactNode; className?: string }) => {
	return <div className={cn("my-8", className)}>{children}</div>
}
