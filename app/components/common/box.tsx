import type { ReactNode } from "react"
import { cn } from "~/lib/utils"
export const LightBox = ({ children, className }: { children: ReactNode; className?: string }) => {
	return <div className={cn("rounded-md border shadow-xs p-4", className)}>{children}</div>
}
