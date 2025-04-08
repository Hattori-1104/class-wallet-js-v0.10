export const Title = ({ children }: { children: string }) => {
	return <h1 className="font-bold text-lg">{children}</h1>
}

export const Note = ({ children }: { children: string }) => {
	return <h2 className="text-muted-foreground leading-none">{children}</h2>
}
