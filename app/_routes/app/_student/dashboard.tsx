import { Link } from "react-router"
import { LightBox } from "~/components/common/box"
import {
	HorizonContainer,
	Section,
	SectionTitle,
} from "~/components/common/container"
import { Heading, NoData, Title } from "~/components/common/typography"
import { prisma } from "~/services/repository.server"
import { verifyStudent } from "~/services/route-module.server"
import { _createErrorRedirect, requireSession } from "~/services/session.server"
import type { Route } from "./+types/dashboard"

export const loader = async ({ request }: Route.LoaderArgs) => {
	const session = await requireSession(request)
	const student = await verifyStudent(session)

	const errorRedirect = _createErrorRedirect(session, "/auth")

	const belongingPartsPromise = prisma.part
		.findMany({
			where: { students: { some: { id: student.id } } },
			select: { id: true, name: true },
		})
		.catch(errorRedirect("パートの取得に失敗しました。").catch())

	const accountingWalletsPromise = prisma.wallet
		.findMany({
			where: { accountantStudents: { some: { id: student.id } } },
			select: { id: true, name: true },
		})
		.catch(errorRedirect("ウォレットの取得に失敗しました。").catch())

	const [belongingParts, accountingWallets] = await Promise.all([
		belongingPartsPromise,
		accountingWalletsPromise,
	])

	return { belongingParts, accountingWallets }
}

export default ({
	loaderData: { belongingParts, accountingWallets },
}: Route.ComponentProps) => {
	return (
		<>
			<HorizonContainer>
				<Section>
					<SectionTitle>
						<Title>所属するパート</Title>
					</SectionTitle>
					<div className="space-y-4">
						{belongingParts.length > 0 ? (
							belongingParts.map((part, index) => (
								<Link
									key={index}
									to={`/app/student/part/${part.id}`}
									className="block"
								>
									<LightBox>
										<Heading>{part.name}</Heading>
									</LightBox>
								</Link>
							))
						) : (
							<NoData>パートに所属していません。</NoData>
						)}
					</div>
				</Section>
				<Section>
					<SectionTitle>
						<Title>会計用ウォレット</Title>
					</SectionTitle>
					<div className="space-y-4">
						{accountingWallets.length > 0 ? (
							accountingWallets.map((wallet, index) => (
								<Link
									key={wallet.id + index}
									to={`/app/student/wallet/${wallet.id}`}
									className="block"
								>
									<LightBox>
										<Heading>{wallet.name}</Heading>
									</LightBox>
								</Link>
							))
						) : (
							<NoData>会計用ウォレットがありません。</NoData>
						)}
					</div>
				</Section>
			</HorizonContainer>
		</>
	)
}
