import { LoaderCircle } from "lucide-react"
import { useNavigate, useNavigation } from "react-router"
import { Button } from "~/components/ui/button"
import type { Icon } from "~/utilities/type"

export function LinkButton({
	label,
	absoluteTo,
	Icon,
}: {
	label: string
	absoluteTo: string
	Icon?: Icon
}) {
	const navigation = useNavigation()
	const navigate = useNavigate()
	const isLoading = navigation.state !== "idle"
	const isActive = navigation.location?.pathname === absoluteTo && isLoading
	const handleClick = () => {
		if (isLoading) return
		navigate(absoluteTo)
	}
	return (
		<Button variant="default" disabled={isLoading} onClick={handleClick}>
			{Icon &&
				(isActive ? <LoaderCircle className="animate-spin" /> : <Icon />)}
			{label}
		</Button>
	)
}
