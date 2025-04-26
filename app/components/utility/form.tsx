import type { ReactNode } from "react"
import { cn } from "~/lib/utils"
import { Label } from "../ui/label"

export const FormField = ({
	label,
	children,
	error,
	className,
	name,
}: { label?: string; children: ReactNode; error?: string[]; className?: string; name: string }) => {
	return (
		<div className={cn("space-y-1", className)}>
			<div className="space-y-2">
				{label && <Label htmlFor={name}>{label}</Label>}
				{children}
			</div>
			{error && (
				<div className="text-red-500 text-sm leading-none">
					{error.map((e) => (
						<p key={e}>{e}</p>
					))}
				</div>
			)}
		</div>
	)
}

export const FormBody = ({ children }: { children: ReactNode }) => {
	return <div className="space-y-4">{children}</div>
}

export const FormFooter = ({ children }: { children: ReactNode }) => {
	return <div className="mt-8">{children}</div>
}
