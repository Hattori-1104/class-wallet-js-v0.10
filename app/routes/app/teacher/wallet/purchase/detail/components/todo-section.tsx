import { AlertCircle, Flag } from "lucide-react"
import { Section } from "~/components/common/container"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"

export const TODOSection = ({ inProgress, message }: { inProgress: boolean; message: string }) => (
	<Section>
		<Alert variant={inProgress ? "default" : "destructive"}>
			{inProgress ? <Flag /> : <AlertCircle />}
			<AlertTitle>TODO</AlertTitle>
			<AlertDescription>{message}</AlertDescription>
		</Alert>
	</Section>
)
