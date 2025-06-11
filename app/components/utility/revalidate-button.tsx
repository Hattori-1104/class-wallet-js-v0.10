import { RotateCw } from "lucide-react"
import type { FC } from "react"
import { useRevalidator } from "react-router"
import { cn } from "~/lib/utils"
import { Button } from "../ui/button"

export const RevalidateButton: FC = () => {
	const { revalidate, state } = useRevalidator()

	return (
		<Button
			size="icon"
			className="rounded-full"
			onClick={revalidate}
			disabled={state === "loading"}
		>
			<RotateCw className={cn(state === "loading" && "animate-spin")} />
		</Button>
	)
}
