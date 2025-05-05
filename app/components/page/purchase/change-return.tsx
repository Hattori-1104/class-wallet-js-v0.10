import { Form } from "react-router"
import { Section, SectionTitle } from "~/components/common/container"
import { Heading, NoData, Title } from "~/components/common/typography"
import { Button } from "~/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible"
import { formatMoney } from "~/utilities/display"

export const ChangeReturn = ({
	givenMoney,
	actualUsage,
	isRequester,
}: { givenMoney: number | null; actualUsage: number | null; isRequester: boolean }) => {
	if (givenMoney === null || actualUsage === null) {
		return (
			<>
				<Section>
					<SectionTitle>
						<Title>お釣り返却 / 不足分補填</Title>
					</SectionTitle>
					<NoData>購入の情報がありません。</NoData>
				</Section>
			</>
		)
	}
	const compensation = givenMoney - actualUsage
	return (
		<>
			<Section>
				<SectionTitle>
					<Title>お釣り返却 / 不足分補填</Title>
				</SectionTitle>
				{compensation === 0 ? (
					<NoData>返却は必要ありません。</NoData>
				) : compensation > 0 ? (
					<>
						<Heading>教師へ返却してください。</Heading>
						<p>返却：{formatMoney(compensation)}</p>
					</>
				) : (
					<>
						<Heading>教師から受け取ってください。</Heading>
						<p>補填：{formatMoney(-compensation)}</p>
					</>
				)}
			</Section>
			{isRequester && (
				<Section>
					<Collapsible>
						<SectionTitle>
							<CollapsibleTrigger asChild>
								<Button variant="outline" className="w-full">
									確認
								</Button>
							</CollapsibleTrigger>
						</SectionTitle>
						<CollapsibleContent>
							<Form method="post">
								<Button type="submit" className="w-full" name="complete" value="complete">
									{compensation > 0 ? "返却" : "補填"}を完了しました。
								</Button>
							</Form>
						</CollapsibleContent>
					</Collapsible>
				</Section>
			)}
		</>
	)
}
