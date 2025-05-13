import { KeyRound } from "lucide-react"
import { Form } from "react-router"
import {
	LimitedContainer,
	Section,
	SectionTitle,
} from "~/components/common/container"
import { LayoutAbsolute } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"

export default () => {
	return (
		<LayoutAbsolute>
			<LimitedContainer>
				<Section>
					<SectionTitle>
						<Title>認証</Title>
					</SectionTitle>
					<Form method="post" action="/app/auth/oauth" className="space-y-4">
						<Button
							type="submit"
							name="userType"
							value="student"
							variant="google"
							className="w-full"
						>
							<KeyRound />
							生徒として認証
						</Button>
						<Button
							type="submit"
							name="userType"
							value="teacher"
							variant="google"
							className="w-full"
						>
							<KeyRound />
							教師として認証
						</Button>
					</Form>
				</Section>
			</LimitedContainer>
		</LayoutAbsolute>
	)
}
