import { Slot } from "@radix-ui/react-slot"
import type { ReactNode } from "react"
import { cn } from "~/lib/utils"
export const LightBox = ({
	children,
	className,
	asChild,
}: { children: ReactNode; className?: string; asChild?: boolean }) => {
	const Component = asChild ? Slot : "div"
	return <Component className={cn("rounded-md border shadow-xs p-4 block", className)}>{children}</Component>
}
