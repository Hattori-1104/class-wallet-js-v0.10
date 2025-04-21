import type { ReactNode } from "react"

export const Title = ({ children }: { children: ReactNode }) => {
	return <h1 className="font-bold text-lg">{children}</h1>
}

export const Note = ({ children }: { children: ReactNode }) => {
	return <h2 className="text-muted-foreground leading-none">{children}</h2>
}
