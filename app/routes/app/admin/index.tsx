import { Link } from "react-router"
import { MainContainer, Section, SectionTitle } from "~/components/common/container"
import { Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { requireSession, verifyAdmin } from "~/services/session.server"
import type { Route } from "./+types/index"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	await verifyAdmin(session)
}

export default () => {
	return (
		<MainContainer>
			<Section>
				<SectionTitle>
					<Title>管理者ページ</Title>
				</SectionTitle>
				<Button asChild>
					<Link to="/app/admin/wallet">ウォレット・予算作成</Link>
				</Button>
			</Section>
		</MainContainer>
	)
}
