import type { LucideProps } from "lucide-react"
import type { ForwardRefExoticComponent, RefAttributes } from "react"

export type Icon = ForwardRefExoticComponent<
	Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
>

export type PickAndSetNonNullable<T, K extends keyof T> = T & {
	[P in K]: NonNullable<T[P]>
}
export type PickAndSetNull<T, K extends keyof T> = T & {
	[P in K]: null
}
