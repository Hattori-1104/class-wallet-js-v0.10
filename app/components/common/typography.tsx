import type { ReactNode } from "react"
import { cn } from "~/lib/utils"
export const Title = ({ children, className }: { children: ReactNode; className?: string }) => {
	return <h1 className={cn("font-bold text-lg", className)}>{children}</h1>
}

export const Heading = ({ children, className }: { children: ReactNode; className?: string }) => {
	return <h2 className={cn("text-lg", className)}>{children}</h2>
}

export const Note = ({ children, className }: { children: ReactNode; className?: string }) => {
	return <h2 className={cn("text-muted-foreground leading-none", className)}>{children}</h2>
}

export const NoData = ({ children, className }: { children: ReactNode; className?: string }) => {
	return <Note className={cn("text-center italic", className)}>{children}</Note>
}
